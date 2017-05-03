require("dotenv").config();
var express = require('express')
  , logger = require('morgan')
  , app = express()
  , template = require('jade').compileFile(__dirname + '/source/templates/start.jade')
  , Speech = require('@google-cloud/speech')
  , https = require('https')
  , bodyParser = require('body-parser')

app.use(logger('dev'))
app.use(express.static(__dirname + '/static'))

app.get('/', function (req, res, next) {
  try {
    var html = template({ title: 'Home' })
    res.send(html)
  } catch (e) {
    next(e)
  }
})

/*
  Might consider a streaming to server approach instead https://subvisual.co/blog/posts/39-tutorial-html-audio-capture-streaming-to-node-js-no-browser-extensions
*/
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/recognize', function (req, res, next) {
  try {
    /*const speech = Speech({
      //projectId: 'sir-attenborough',
      key: process.env.GOOGLE_API_KEY
    });*/
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 44100,
      languageCode: 'sv-SE',
      maxAlternatives: 3
    };
    //console.log("Data: " + req.query.data);
    /*speech.recognize({content: req.query.data}, config)
      .then((results) => {
        const result = results[0];
        console.log("Transcription: ${result}")
        res.send('{ "status": "got result" }');
      }, (reason) => {
        console.log(reason);
        res.status(500).send('Error calling speech API: ' + reason);
      });*/
    const post = {
      host: 'speech.googleapis.com',
      port : 443,
      path: '/v1/speech:recognize?key=' + process.env.GOOGLE_API_KEY,
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json'
      }
    };
    var request = https.request(post, function(speechResponse) {
      console.log('Status: ' + speechResponse.statusCode);
      console.log('Headers: ' + JSON.stringify(speechResponse.headers));
      speechResponse.setEncoding('utf8');
      speechResponse.on('data', (answer) => {
        console.log('Answer: ' + answer);
        var json = JSON.parse(answer);
        var transcripts = [];
        if(!("undefined" === typeof json.results
           && json.results.length > 0
           && "undefined" === typeof json.results.alternatives)) {
          transcripts = json.results[0].alternatives;
        }
        res.send(JSON.stringify(transcripts));
      })
    });
    //console.log('data', req.body);
    request.write(JSON.stringify({
      config: config,
      audio: {
        content: req.body.data.substring(req.body.data.indexOf(',') + 1)
      }
    }));
    request.end()
    request.on('error', (reason) => {
      console.log(reason);
      res.status(500).send('Error calling speech API: ' + reason);
    });
  } catch (e) {
    next(e)
  }
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Listening on http://localhost:' + (process.env.PORT || 3000))
})
