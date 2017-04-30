var express = require('express')
  , logger = require('morgan')
  , app = express()
  , template = require('jade').compileFile(__dirname + '/source/templates/start.jade')
  , Speech = require('@google-cloud/speech')

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

app.get('/recognize', function (req, res, next) {
  try {
    const speech = Speech({
      projectId: 'I-dont-know',
      keyFilename: 'keyfile.json'
    });
    const googleRequest = {
      encoding: 'FLAC',
      sampleRateHertz: 16000,
      languageCode: 'sv-SE'
    };
    //console.log("Data: " + req.query.data);
    speech.recognize({content: req.query.data}, googleRequest)
      .then((results) => {
        const result = results[0];
        console.log("Transcription: ${result}")
        res.send('{ "status": "got result" }');
      }, (reason) => {
        console.log(reason);
        res.status(500).send('Error calling speech API: ' + reas);
      });
      res.send('{ "status": "ok" }');
  } catch (e) {
    next(e)
  }
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Listening on http://localhost:' + (process.env.PORT || 3000))
})
