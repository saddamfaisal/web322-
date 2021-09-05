const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
var nodemailer = require('nodemailer');

app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

app.use(express.static(path.join(__dirname, '/public')));


app.get('/', (req, res) => {
    res.render('HomePage');
})

app.get('/stylesheet.css', (req, res) => {
    res.sendFile(path.join(__dirname, '/Views/stylesheet.css'));
});

app.get('/home', (req, res) => {
    res.render('HomePage');

})
app.get('/registeration', (req, res) => {
    res.render('Register');

})
app.get('/login', (req, res) => {
    res.render('Login');
})
app.post('/login', bodyParser.urlencoded({ extended: true }), (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let data = {
        username: false,
        password: false,
    }
    if (username === "") {
        data.username = true;
        res.render('Login', { data: data })
    }
    if (password === "") {
        data.password = true;
        res.render('Login', { data: data })
    }

})
app.post('/registeration', bodyParser.urlencoded({ extended: true }), (req, res) => {
    let email = req.body.email;
    let fname = req.body.fname;
    let lname = req.body.lname;
    let date = req.body.date;
    let password = req.body.password;
    let data = {
        email: false,
        password: false,
        fname: false,
        lname: false,
        date: false,
        emailValidation: false,

    }
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,12}$/;

    if (email === "") {
        data.email = true;
        res.render('Register', { data: data })
    }
    else if (!re.test(email)) {
        data.emailValidation = true;
        res.render('Register', { data: data })
    }
    if (password === "") {
        data.password = true;
        res.render('Register', { data: data })
    }
    else if (!passw.test(password)) {
        data.passwordValidation = true;
        res.render('Register', { data: data })
    }

    if (fname === "") {
        data.fname = true;
        res.render('Register', { data: data })
    }
    if (lname === "") {
        data.lname = true;
        res.render('Register', { data: data })
    }
    if (date === "") {
        data.date = true;
        res.render('Register', { data: data })
    }
    
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'sadamalheraky1990@gmail.com',
          pass: 'Fatosh2000'
        }
      });
      
      var mailOptions = {
        from: 'sadamalheraky1990@gmail.com',
        to: email,
        subject: 'Welcome to Airbnb',
        text: 'dear '+fname+'\nWelcome to Airbnb\n\n We are really happy to have you as a new member at our website.'
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          res.render('HomePage');
        }
      });
      


})

app.get('/roomListing', (req, res) => {

    res.render('RoomListingPage');

})


app.listen(8080);