const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

// Express Application init
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.set('view engine', 'ejs');

app.listen(3011, () => console.log('Backend server running on 3011'));

const saltRounds = 10;

app.get('/', (req, res) => {
    res.send('Homepage ROute');
})

app.post('/post', async (req, res) => {
    const { username, password, role, hospitalid } = req.body;
    const pass = 'patientpw';
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const temp = '$2b$10$bt2pydfjwmg/hSMRcuHhsugqkZ5Au4vDGIgSLfmf4qno5vD6ZpNf6';
    const comp = bcrypt.compare(pass, temp);
    if (comp) {
        res.send('Matches!');
        console.log(`name: ${username}, pass: ${password}, hashPassword: ${hashPassword}, role: ${role}, id: ${hospitalid}`)

    }
    else 
        res.send('Doesnt match!');
    // console.log(`name: ${username}, pass: ${password}, hashPassword: ${hashPassword}, role: ${role}, id: ${hospitalid}`)
    // res.send({"hashPassword": hashPassword});
})