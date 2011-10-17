var https = require('https'); 
var util = require('util'); 
var fs = require('fs'); 
var webid = require('./webid.js');


var configuration = require("./configuration");

var options = {   key: fs.readFileSync('./ssl/privatekey.pem'),   
                  cert: fs.readFileSync('./ssl/certificate.pem'),   
                  requestCert: true, }; 

var profilePage = function(profile) {
    var html = "<html><head><title>Success: "+profile.toArray()[0].subject.valueOf()+"</title></head><body>"

    var depiction = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/depiction") }).toArray();
    if(depiction.length === 1) {
        depiction = depiction[0].object.valueOf();
    }
    var familyName = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/family_name") }).toArray();
    if(familyName.length === 1) {
        familyName = familyName[0].object.valueOf();
    }

    var givenName = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/givenname") }).toArray();
    if(givenName.length === 1) {
        givenName = givenName[0].object.valueOf();
    }

    var nick = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/nick") }).toArray();
    if(nick.length === 1) {
        nick = nick[0].object.valueOf();
    }

    var homepage = profile.filter(function(t){ return t.predicate.equals("http://xmlns.com/foaf/0.1/homepage") }).toArray();
    if(homepage.length === 1) {
        homepage = homepage[0].object.valueOf();
    }

    html = html + "<p><img src='"+depiction+"'></img>";
    html = html + "<a href='"+homepage+"'>"+givenName+" "+familyName+" ("+nick+")</a></p>";

    html = html + "</body></html>";
    return html

};

console.log("trying to create server at "+configuration.port);

https.createServer(options,function (req, res) { 
    if(req.url == "/login") {
        var certificate = req.connection.getPeerCertificate();
        if(certificate) {
            var verifAgent = new webid.VerificationAgent(certificate);
            verifAgent.verify(function(err, profileGraph){
                if(err) {
                    res.writeHead(400,{"Content-Type":"text/plain"});
                    res.write(profileGraph);
                } else {
                    res.writeHead(200,{"Content-Type":"text/html"});
                    res.write(profilePage(profileGraph));
                }
                res.end();
            });
        } else {
            res.writeHead(400,{"Content-Type":"text/plain"});
            res.write("not auth");
            res.end();
        }
    } else {
        res.writeHead(200,{"Content-Type":"text/html"});
        html = "<html><p>This is a demo implementation of WebID in Node.js.</p><p>Click <a href='/login'>here</a> to log in using WebID.</p>"
        html = html + "<p>You can get your WebID in a provider like <a href='http://foaf.me/index.php'>this</a> or create your own.</p>"
        html = html + "<p><a href='http://www.w3.org/wiki/WebID'>This W3C wiki page</a> is a good place to learn more about WebID and why you should care about it</p>";

        res.write(html);
        res.end();
    }
}).listen(configuration.port);

console.log("server running at "+configuration.port);
