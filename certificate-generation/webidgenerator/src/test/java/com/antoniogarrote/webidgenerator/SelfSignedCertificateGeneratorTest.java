package com.antoniogarrote.webidgenerator;

import junit.framework.TestCase;

import java.io.*;

/**
 * Created by IntelliJ IDEA.
 * User: antonio
 * Date: 03/01/2012
 * Time: 14:32
 * To change this template use File | Settings | File Templates.
 */
public class SelfSignedCertificateGeneratorTest extends TestCase{
    public void testGenerate() {
        String testCertificatePath = new String("/tmp/testcertificate.p12");
        
        File testCertificate = new File(testCertificatePath); 
        if(testCertificate.exists())
            testCertificate.delete();
        
        String[] args = {"http://localhost:8081/social#me",
                         testCertificatePath,
                         "test"};
        PrintStream oldOut = System.out;
        ByteArrayOutputStream newOut = new ByteArrayOutputStream();
        System.setOut(new PrintStream(newOut));
        SelfSignedCertficateGenerator.main(args);
        System.setOut(oldOut);

        assertTrue(newOut.toString().indexOf("\"uri\": \"http://localhost:8081/social#me\"}")!=-1);
        assertTrue(testCertificate.exists());
    }
}
