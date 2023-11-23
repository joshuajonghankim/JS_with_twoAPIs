//Riot Games API & Lingua Robot API
//Joshua Jonghan Kim

const http = require('http');
const https = require('https');
const port = 3000;

//create server
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {

    //localhost:3000
    //simple page requires nickname and server
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(`
      <form method="POST" action="/submit">
        <label for="nickname">Nickname:</label>
        <input type="text" id="nickname" name="nickname" required>
        <br>
        <label for="region">Region:</label>
        <select id="region" name="region" required>
          <option value="">Select Region</option>
          <option value="na1">NA</option>
          <option value="br1">BR</option>
          <option value="euw1">EU WEST</option>
          <option value="eun1">EU NE</option>
          <option value="kr">KR</option>
          <option value="jp1">JP</option>
        </select>
        <br>
        <button type="submit">Submit</button>
      </form>
    `);
    res.end();
  } else if (req.method === 'POST' && req.url === '/submit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const formData = new URLSearchParams(body);
      const nickname = formData.get('nickname');
      const region = formData.get('region');

      // This starts the API requests!
      callAPIs(nickname, region, (result1, result2) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});

        //entered nickname and region
        res.write(`Entered Nickname: ${nickname}\nEntered Region: ${region}\n`);
        
        //result1 from Riot API
        if(result1 === 'empty'){
          res.write(`\n${nickname} is not in the League of Legends Server.\n`);
        }
        else{
          res.write(`\n${nickname} is in the League of Legends Server.\n`);
        }

        //result2 from Lingua Robot API
        if(result2 === 'empty'){
          res.write(`\n${nickname} is not in the Lingua Robot Database.`);
        }
        else{
          res.write('\nDefinition: ' + result2);
        }        
        res.end();
      });      
    });
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('404 Not Found');
    res.end();
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

function callAPIs(nickname, region, callback) {
  callAPI1(nickname, region, function(result1) {// These callbacks guarantee the asynchronous executions.
    callAPI2(nickname, function(result2) {
      callback(result1, result2);
    });
  });
}

//Verify that an account with that nickname exists using Riot Games API.
function callAPI1(nickname, region, callback){  
  const options_LOL = {
    method: 'GET',
    hostname: `${region}.api.riotgames.com`,
    port: null,
    path: `/lol/summoner/v4/summoners/by-name/${nickname}?api_key=RGAPI-e3d8cb26-1119-453a-b5c5-f3ec7e0bdb4a`,//API KEY HERE!
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,zh-CN;q=0.5,zh;q=0.4",
      "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8"
    }
  };
  
  const req1 = https.request(options_LOL, function (res) {
    console.log('\nAPI 1 has been called.');
    console.log(`The information of ${nickname} will be searched using Riot Games API`);
    const chunks = [];
  
    res.on('data', function (chunk) {
      chunks.push(chunk);
    });
  
    res.on('end', function () {
      const body1 = Buffer.concat(chunks);
      let data = JSON.parse(body1); //JSON to object
      if('status' in data){
        console.log(data.status.message);
        result1 = 'empty';
      }
      else{
        console.log(data.name);
        console.log(data);
        result1 = data.name
      }      
      callback(result1); //callback
    });
  });  
  req1.end();//
}

//Search the definition of the nickname using Lingua Robot API.
function callAPI2(nickname, callback){
  const options_Lingua = {
    method: 'GET',
    hostname: 'lingua-robot.p.rapidapi.com',
    port: null,
    path: `/language/v1/entries/en/${nickname}`,
    headers: {
      'X-RapidAPI-Key': '1c77cb41e0msh4ec2890884509f5p1c64e5jsn839cb292b5f9', //API KEY HERE!
      'X-RapidAPI-Host': 'lingua-robot.p.rapidapi.com'
    }
  };
  
  const req2 = https.request(options_Lingua, function (res) {
    console.log('\nAPI 2 has been called');
    console.log(`${nickname} will be searched using Lingua Robot API`);
    const chunks = [];
  
    res.on('data', function (chunk) {
      chunks.push(chunk);
    });
  
    res.on('end', function () {
      const body2 = Buffer.concat(chunks);
      let data = JSON.parse(body2);
      if(data.entries.length === 0){
        result2 = 'empty';
        console.log(`\n${nickname} is not in the Lingua Robot Database.`);
        console.log(data);
      }
      else{        
        result2 = data.entries[0].lexemes[0].senses[0].definition;
        console.log(data.entries[0].lexemes[0].senses[0].definition);
        console.log(data);
      }
      callback(result2); //callback
    });
  });
  
  req2.end();
}