const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;
let admin = null;

// Embedded credentials — avoids env var escaping issues on Hostinger
const EMBEDDED_CREDENTIALS = {
  type: 'service_account',
  project_id: 'gate-ad44c',
  private_key_id: '3187abc2f14051aa84002d8c6454d3b822a7b889',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDO+HbN7q3BNNzH\n0C1415SyFdTP6oKa/Cr9c9oHyUgsM9OptUqo0VDJW28bfTvsne8yuUp4v5ejD4jP\nKzauy92LoHOBC7/uEM4eSS/yZyE3d9nYfqUwnwu7FqUcP8dqRpZ2DgqU3UzQw5hb\nDImQez1PCB2UHmwZFhrSMRYN3ppqM4qaOgQDAeYnUqgZ+OEznB5PQQ1omUCt9h9t\nFiQfS+hRM6VAe6GYYlc4cYL9C4ReprUKtYlN9qYEM1OKWT4X+pmTgCh4VV4J76uf\nvaGpsG0NB4kEWmk5jZcpPO/6A0cxfv+e2xlEraPb8HyuZ357WMkNLhzukrieRt5d\naGhHvdphAgMBAAECggEAFHDmZeoU49Q1WnApb4oGI+0DTMoV3ln5onjUz6hN3hy7\nwsL2ldP/cTWcNHgyyQijoUw6ylBs2ORNwB093DdjAPlmsvfuu6PSAZx7lWqhVZW7\nEJZYeQP6P/7pbW/woWLJlS0Hl0KAhc1NkK99LiV3zYSJDFIRXcxot3n02keSE1so\nhCyPDVmsA2bXzkkO+Ojz6otWYUpGbfFlCidZ17Bp854SJ4gvfCG7JXVw6+wcur5z\n1vqG9c7jNmE3cNgz8Uur1iPe9PXeLkcwIuqGVNWRbsb2o06T7HhVY1L0YzOrszSS\nuKQiHnq1ef9egd7iDFyI7+crYPOAz5htyZXOAq1feQKBgQDzBUnuAIFl9133eWt9\nSPkG9Q1xYxp0cjiyWg/6hPul4fp+kUzMpn17QiT0bCdd6IzWMPzoyKTXhOZ7b/2F\nYqigbXIQuYhhELzOVJ6lpDOXzUDBMNKlH9DleZ8MNGWWAmshUytBIV5RslbVXEL/\nnS4cJrrm/AnLjYNEnAfBuC6IyQKBgQDaBkdXfswq5Gx2ZxmFFNsh2nI407WEn0wX\nw/NkA2uocNB1UBz4Bi4d5rjpf+NHcBjPKASd/vrm55RmO5DSjNM++pH46/1th8Qh\nImqfCsvhXOPojxzy7BwMN6Y/FuV06aybqIOrjy18lTcXg15MQycFGg9kZT90TAbo\nEjTl9kio2QKBgDpXGbFmM6o74TYI0xInk4jlCU4gIXi09wFx94YHqLXg8xaxYQN8\nMIGHloGK+URlEHJXHk/v4wrOH9qgPvdngN3KiGiVcbUDpJ/P1qojKjOWFaaLRvZX\nFfoQ4Wq3pW+Gsxsz8R1YmmD4dDoSRQ9CN5CQh6vt85gHJ+0vm/kYcytpAoGAJFCP\naX9xOmO5vS8HDSegKE9eXyDER0bRQdQdojb/o5rG3gNuD9HXtJtNiXcHwEpnl3mu\n6zIhUHyaNz0MrkVOmlraHYARQkEu5eX5pGwD8ZGrVH0h8URql45dXnzN019opLS4\n2caLaQjhmEUFW+aDhVIF5k8G9rQDInyF2xfemmECgYALsnB8DSZOfm81ZpPTL03n\nHpUt2yNmyrEcjwpmio9txT0ZvGFJJWHVD/DiMlhMZwBNDQ8D+oG+N0x1qqJWwiOD\n2vXxKBR1hRyVwjj9XnUu8Bs50+xEQePxgOXJN3yn4bWVvMKCobbYlW6r1XtH+yN7\nYnA0Bzp8nleHw/ihfuJnyw==\n-----END PRIVATE KEY-----\n',
  client_email: 'firebase-adminsdk-fbsvc@gate-ad44c.iam.gserviceaccount.com',
  client_id: '103499696732136724792',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gate-ad44c.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};

const initializeFirebase = () => {
  try {
    admin = require('firebase-admin');
  } catch (e) {
    console.warn('firebase-admin not installed — push notifications disabled.');
    return;
  }

  // Use embedded credentials directly — no env var or file needed
  const serviceAccount = EMBEDDED_CREDENTIALS;

  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized for project:', serviceAccount.project_id);
  } catch (err) {
    console.warn('Firebase init failed:', err.message);
  }
};

initializeFirebase();

module.exports = { admin, isFirebaseReady: () => firebaseInitialized };
