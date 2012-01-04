var raptor = require('../src/raptor.js');
var rdfstore = require('../src/rdfstore.js');
var webid = require('../src/webid.js');
var https = require('https'); 
var exec = require('child_process').exec;
var fs = require('fs'); 

var webID = "https://bob.example/profile#me";
var modulus = "cb24ed85d64d794b69c701c186acc059501e856000f661c93204d8380e07191c5c8b368d2ac32a428acb970398664368dc2a867320220f755e99ca2eecdae62e8d15fb58e1b76ae59cb7ace8838394d59e7250b449176e51a494951a1c366c6217d8768d682dde78dd4d55e613f8839cf275d4c8403743e7862601f3c49a6366e12bb8f498262c3c77de19bce40b32f89ae62c3780f5b6275be337e2b3153ae2ba72a9975ae71ab724649497066b660fcf774b7543d980952d2e8586200eda4158b014e75465d91ecf93efc7ac170c11fc7246fc6ded79c37780000ac4e079f671fd4f207ad770809e0e2d7b0ef5493befe73544d8e1be3dddb52455c61391a1";
var exponent = "65537";

var certificate = {
    modulus: modulus,
    exponent: exponent,
    subjectaltname: 'URI:https://bob.example/profile#me'
};

exports.loadRDFa = function(test) {
    var html = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML+RDFa 1.0//EN\"\
                  \"http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd\">\
                <html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\" version=\"XHTML+RDFa 1.0\" dir=\"ltr\"\
                      xmlns:cert=\"http://www.w3.org/ns/auth/cert#\"\
                      xmlns:foaf=\"http://xmlns.com/foaf/0.1/\"\
                      xmlns:xsd=\"http://www.w3.org/2001/XMLSchema#\">\
                <head>\
                   <title>Welcome to Bob's Home Page</title>\
                </head>\
                <body>\
                <!-- WebID HTML snippet. The xmlns declarations above can be moved into the div below if needed-->\
                <div about=\"#me\" typeof=\"foaf:Person\">\
                  <span property=\"foaf:name\">Bob</span>\
                  <h2>My Good Friends</h2>\
                  <ul>\
                    <li rel=\"foaf:knows\" href=\"https://example.edu/p/Alois#MSc\">Alois</li>\
                  </ul>\
                  <h2>My RSA Public Keys</h2>\
                  <div rel=\"cert:key\">\
                    <p>I made this key on the 23 November 2011 from my laptop.</p>\
                    <div typeof=\"cert:RSAPublicKey\">\
                      <dl>\
                      <dt>Modulus (hexadecimal)</dt>\
                      <dd style=\"word-wrap: break-word; white-space: pre-wrap;\"\
                         property=\"cert:modulus\" datatype=\"xsd:hexBinary\">cb24ed85d64d794b69c701c186acc059501e856000f661c93204d8380e07191c5c8b368d2ac32a428acb970398664368dc2a867320220f755e99ca2eecdae62e8d15fb58e1b76ae59cb7ace8838394d59e7250b449176e51a494951a1c366c6217d8768d682dde78dd4d55e613f8839cf275d4c8403743e7862601f3c49a6366e12bb8f498262c3c77de19bce40b32f89ae62c3780f5b6275be337e2b3153ae2ba72a9975ae71ab724649497066b660fcf774b7543d980952d2e8586200eda4158b014e75465d91ecf93efc7ac170c11fc7246fc6ded79c37780000ac4e079f671fd4f207ad770809e0e2d7b0ef5493befe73544d8e1be3dddb52455c61391a1</dd>\
                      <dt>Exponent (decimal)</dt>\
                      <dd property=\"cert:exponent\" datatype=\"xsd:integer\">65537</dd>\
                      </dl>\
                    </div>\
                  </div>\
                 \
                </div>\
                <!-- WebID HTML snippet -->\
                </body>\
                </html>";

    var verificationAgent = new webid.VerificationAgent(certificate);
    verificationAgent._parseAndLoad('application/xhtml+xml', webID, html, function(success,store){
	test.ok(success === true);
	var query = verificationAgent._buildVerificationQuery(webID,modulus,exponent);
	store.execute(query, function(success, results) {
	    test.ok(results === true);
	    test.done();
	});
    });
};


exports.loadXMLRDF = function(test) {
    var xml = "<?xml version=\"1.0\"?>\
                <rdf:RDF\
                 xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"\
                 xmlns:rdfs=\"http://www.w3.org/2000/01/rdf-schema#\"\
                 xmlns:cert=\"http://www.w3.org/ns/auth/cert#\"\
                 xmlns:xsd=\"http://www.w3.org/2001/XMLSchema#\"\
                 xmlns:foaf=\"http://xmlns.com/foaf/0.1/\">\
                  <foaf:Person rdf:about=\"https://bob.example/profile#me\">\
                    <foaf:name>Bob</foaf:name>\
                    <foaf:weblog rdf:resource=\"http://bob.example/blog\"/>\
                    <cert:key>\
                      <cert:RSAPublicKey>\
                        <rdfs:label>made on 23 November 2011 on my laptop</rdfs:label>\
                        <cert:modulus rdf:datatype=\"http://www.w3.org/2001/XMLSchema#hexBinary\">cb24ed85d64d794b69c701c186acc059501e856000f661c93204d8380e07191c5c8b368d2ac32a428acb970398664368dc2a867320220f755e99ca2eecdae62e8d15fb58e1b76ae59cb7ace8838394d59e7250b449176e51a494951a1c366c6217d8768d682dde78dd4d55e613f8839cf275d4c8403743e7862601f3c49a6366e12bb8f498262c3c77de19bce40b32f89ae62c3780f5b6275be337e2b3153ae2ba72a9975ae71ab724649497066b660fcf774b7543d980952d2e8586200eda4158b014e75465d91ecf93efc7ac170c11fc7246fc6ded79c37780000ac4e079f671fd4f207ad770809e0e2d7b0ef5493befe73544d8e1be3dddb52455c61391a1</cert:modulus>\
                        <cert:exponent rdf:datatype=\"http://www.w3.org/2001/XMLSchema#integer\">65537</cert:exponent>\
                      </cert:RSAPublicKey>\
                    </cert:key>\
                  </foaf:Person>\
                </rdf:RDF>";

    var verificationAgent = new webid.VerificationAgent(certificate);
    verificationAgent._parseAndLoad('application/rdf+xml', webID, xml, function(success,store){
	test.ok(success === true);
	var query = verificationAgent._buildVerificationQuery(webID,modulus,exponent);
	store.execute(query, function(success, results) {
	    test.ok(results === true);
	    test.done();
	});
    });
};

exports.generateCertificate = function(test) {
    webid.generateCertificate(webID, "test", "./test.cert", function(success, certificate) {
	console.log(certificate);
	test.ok(certificate.location == "./test.cert");
	test.done();
    });
};