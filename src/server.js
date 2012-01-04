var https = require('https'); 
var util = require('util'); 
var fs = require('fs'); 
var webid = require('./webid.js');


var configuration = require("./configuration");

var options = { key: fs.readFileSync('./ssl/privatekey.pem'),   
                cert: fs.readFileSync('./ssl/certificate.pem'),   
                requestCert: true }; 

var profilePage = function(profile) {
    var html = "<html><head><title>Success: "+profile.toArray()[0].subject.valueOf()+"</title></head><body>";
    html = html + "<h1>Success: &lt;"+profile.toArray()[0].subject.valueOf()+"&gt;</h1>";
    html = html + "<h2>Formatted Data</h2>";
    var depiction = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/depiction"); }).toArray();
    if(depiction.length === 1) {
        depiction = depiction[0].object.valueOf();
    } else {
        depiction = "#";
    }
    var familyName = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/family_name"); }).toArray();
    if(familyName.length === 1) {
        familyName = familyName[0].object.valueOf();
    } else {
        familyName = "";
    }

    var givenName = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/givenname"); }).toArray();
    if(givenName.length === 1) {
        givenName = givenName[0].object.valueOf();
    } else {
        givenName = "";
    }

    var nick = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/nick"); }).toArray();
    if(nick.length === 1) {
        nick = nick[0].object.valueOf();
    } else {
        nick = "";
    }

    var homepage = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/homepage"); }).toArray();
    if(homepage.length === 1) {
        homepage = homepage[0].object.valueOf();
    } else {
        homepage = "";
    }

    html = html + "<p><img src='"+depiction+"'></img>";
    html = html + "<a href='"+homepage+"'>"+givenName+" "+familyName+" ("+nick+")</a></p>";

    html = html + "<h2>Linked Profile</h2>";
    html = html + "<p>"+profile.toNT().replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\r\n/g,"<br/>")+"</p>";
    html = html + "</body></html>";
    return html;

};

console.log("trying to create server at "+configuration.port);

https.createServer(options,function (req, res) { 
    if(req.url == "/login") {
        try {
            var certificate = req.connection.getPeerCertificate();
            if(certificate) {
                var verifAgent = new webid.VerificationAgent(certificate);
                verifAgent.verify(function(err, result){
                    if(err) {
                        res.writeHead(400,{"Content-Type":"text/plain"});
                        res.write(result||"");
                    } else {
			var webid = result.webid;
			var query = "CONSTRUCT { <"+webid+"> ?p ?o } WHERE { <"+webid+"> ?p ?o }";
			result.store.execute(query, function(success, profileGraph){
			   res.writeHead(200,{"Content-Type":"text/html"});
			   res.write(profilePage(profileGraph));
		        }); 
                    }
                    res.end();
                });
            } else {
                res.writeHead(400,{"Content-Type":"text/plain"});
                res.write("not auth");
                res.end();
            }
        } catch(e) {
                res.writeHead(500,{"Content-Type":"text/plain"});
                res.write("There was an error processing your certificate");
                res.end();
        }
    } else {
        res.writeHead(200,{"Content-Type":"text/html"});
        html = "<html><head><title>WebID node.js Demo</title></head><body>";
        html = html+ "<p>This is a demo implementation of <a href='http://www.w3.org/2005/Incubator/webid/spec/'>WebID</a> running on <a href='http://nodejs.org/'>node.js</a>.</p><p>Click <a href='/login'><b>here</b></a> to log in using WebID.</p>";
        html = html + "<p>You can get your WebID in a provider like <a href='http://foaf.me/index.php'>this one</a> or create your own.<br/>";
        html = html + "<a href='http://www.w3.org/wiki/WebID'>This W3C wiki page</a> is a good place to learn more about WebID and why you should care about it</p></body></html>";

        res.write(html);
        res.end();
    }
}).listen(configuration.port);

console.log("server running at "+configuration.port);
