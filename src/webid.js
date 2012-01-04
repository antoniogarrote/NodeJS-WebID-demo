var raptor = require('./raptor.js');
var url = require('url');
var http = require('http');
var rdfstore = require('./rdfstore.js');
var exec = require('child_process').exec

exports.VerificationAgent = function(certificate){
    this.subjectAltName = certificate.subjectaltname;
    this.modulus = certificate.modulus;
    this.modulus = (''+this.modulus).replace(/^([0]{2})+/,"");
    this.exponent = ''+parseInt(certificate.exponent,16);
    this.uris = this.subjectAltName.split(",");
    for(var i=0; i<this.uris.length; i++) {
        this.uris[i] = this.uris[i].split("URI:")[1];
    }
};

exports.VerificationAgent.prototype.verify = function(callback) {
    this._verify(this.uris,callback);
};

exports.VerificationAgent.prototype._verify = function(uris, callback) {
    if(uris.length === 0) {
        callback(true,"NotVerified");
    } else {
        var that = this;
        var parsedUrl = url.parse(uris[0]);
        var options = {host: parsedUrl.host,
                       path: parsedUrl.pathname,
                       method: 'GET',
                       headers: {"Accept": "application/rdf+xml,application/xhtml+xml,text/html"}};

        var req = http.request(options,function(response){
            if(response.statusCode==200) {
                var res = "";
                
                response.on('data', function(chunk){
                    res = res+chunk;
                });

                response.on('end', function(){
                    var contentType = (response.headers['content-type'] || response.headers['Content-Type']);
		    if(contentType.indexOf(";") != -1)
			contentType = contentType.split(";")[0];
                    if(contentType) {
                        that._verifyWebId(uris[0], res, contentType, callback);
                    } else {
                        callback(true,"missingResponseContentType");
                    }
                });
            } else {
                callback(true, "badRemoteResponse");
            }
        });

        req.on('error', function(error) {
            uris.shift();
            that._verify(uris, callback);
        });

        req.end();
    }
};

exports.VerificationAgent.prototype._verifyWebId = function(webidUri, data, mediaTypeHeader, callback) {
    var that = this;

    this._parseAndLoad(mediaTypeHeader, webidUri, data, function(success, store){
	if(success) {
	    var query = that._buildVerificationQuery(webidUri, that.modulus, that.exponent);
	    store.execute(query, function(success, result) {
		if(success && result) {
		    callback(false, {'webid':webidUri, 'store':store});
		} else {
		    callback(true, "Profile data does not match certificate information");
		}
	    });
	} else {
	    callback(true, "Error parsing profile document");
	}
    });
};

exports.VerificationAgent.prototype._buildVerificationQuery = function(webid, modulus, exponent) {
    return "PREFIX : <http://www.w3.org/ns/auth/cert#>\
	    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\
	    ASK {\
               <"+webid+"> :key [\
                 :modulus \""+modulus+"\"^^xsd:hexBinary;\
                 :exponent "+exponent+";\
               ] .\
            }";
};

exports.VerificationAgent.prototype._parseAndLoad = function(mediaTypeHeader, webidUri, data, cb) {
    if(mediaTypeHeader === "application/rdf+xml") {
        mediaType = 'rdfxml';
    } else {
        mediaType = 'rdfa';
    }

    var parser = raptor.newParser(mediaType);
    var statements = "";
    var nextStatement = "";

    parser.on('statement', function(statement) {
        nextStatement = "<"+statement.subject.value+"><"+statement.predicate.value+">";
        if(statement.subject.type === "uri") {
            nextStatement = "<"+statement.subject.value+"><"+statement.predicate.value+">";	    
	} else {
            nextStatement = "_:"+statement.subject.value+"<"+statement.predicate.value+">";
	}

        if(statement.object.type === "uri") {
            nextStatement = nextStatement + "<"+statement.object.value+">.";
        } else if(statement.object.type === "bnode"){
            nextStatement = nextStatement + "_:"+statement.object.value+".";
	} else {
            if(statement.object.type === 'typed-literal') {
                nextStatement = nextStatement + "\""+statement.object.value+"\"^^<"+statement.object.datatype+">.";
            } else {
                nextStatement = nextStatement + "\""+statement.object.value+"\".";
            }
        }

        statements = statements+nextStatement;
    });

    parser.on('end', function(){
        rdfstore.create(function(store){
            store.load("text/turtle",statements,function(success, results) {
			   if(success) {
			       cb(true, store);
			   } else {
			       cb(false, null);
			   }
	    });
	});
    });    

    parser.parseStart(webidUri);
    parser.parseBuffer(new Buffer(data));
    parser.parseBuffer();
};

/**
 * Generates a new WebID certificate  for
 * the provided options and stores it in
 *  the provided path
 */
exports.generateCertificate = function(webid, password, path, callback) {
    var command = 'java -cp ./certificate-generation/webidgenerator/target/webidgenerator-1.0-SNAPSHOT.jar:./certificate-generation/webidgenerator/deps/bcpg-jdk16-146.jar:./certificate-generation/webidgenerator/deps/bcmail-jdk16-146.jar:./certificate-generation/webidgenerator/deps/bcprov-jdk16-146.jar:./certificate-generation/webidgenerator/deps/bcprov-ext-jdk16-146.jar:./certificate-generation/webidgenerator/deps/bctsp-jdk16-146.jar com.antoniogarrote.webidgenerator.SelfSignedCertficateGenerator';
    command += " " + webid + " " + path + " " + password;
    exec(command, function(stderr, stdout, _stdin) {
        if(stderr) {
            callback(true, stderr);
        } else {
            try {
                var data = JSON.parse(stdout);

                //var cert = {'modulus':data.modulus,
                //            'exponent':data.exponent,
                //            'webid':data.uri};

                callback(false, data);
            } catch(e) {
                callback(true, e);
            }
        }
    });
};
