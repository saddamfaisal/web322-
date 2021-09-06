const express = require('express');
const process = require('process');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const { stringify } = require('querystring');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const clientSessions = require("client-sessions");
require('dotenv').config();

const HTTP_PORT = process.env.PORT || 8080;


let db = mongoose.createConnection("mongodb+srv://saddam:" + process.env.PWD + "@senecaweb.mbrr1.mongodb.net/" + process.env.DBNAME + "?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true});

let UsersSchema = new Schema({
    "email": { "type": String, "unique": true, },
    "password": String,
    "fname": String,
    "lname": String,
    "bod": Date,
    "userType":Number,//for regular user and 1 for admin which we already inserted from the database so that not anyone could be an administrator
});
app.use(clientSessions({
    cookieName: "session",
    secret: "week10example_web322", 
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60 
  }));

app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

app.use(express.static(path.join(__dirname, '/public')));


app.get('/', (req, res) => {
    res.render('HomePage');
})

app.get('/stylesheet.css', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/stylesheet.css'));
});

app.get('/home', (req, res) => {

    if(req.session.userType==0){
        let data = {fname:req.session.fname,
                    lname:req.session.lname,}
        res.render('AdminDashboard',{data:data});
    }
    if(req.session.userType==1){
        let data = {fname:req.session.fname,
                    lname:req.session.lname,}
        res.render('UserDashboard',{data:data});
    }
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
    let Users = db.model("Users", UsersSchema);
    let data = {username:false,password:false}
    if (username === "") {
        data.username = true;
        res.render('Login', { data: data })
    }
    if (password === "") {
        data.password = true;
        res.render('Login', { data: data })
    }

    Users.findOne({
        email:username,
    }).exec().then(

        (user)=>{
            if(!user){
                let data = {wronguser:true};
                res.render('Login',{data:data});

            }
            else{

                bcrypt.compare(password, user.password).then((result)=>{
                    if(result===true){
                        req.session.fname=user.fname;
                        req.session.lname=user.lname;
                        req.session.userType=user.userType;
                        let data = {
                            fname: req.session.fname,
                            lname: req.session.lname,
                        }
                        
                        if(user.userType==1){
                            res.render('AdminDashboard',{data: data});
                        }
                        else{
                            res.render('UserDashboard',{data: data});
                        }
                    }
                    else{
                       let data = {wrongpassword:true}
                        
                        res.render('Login',{data:data});
                    }

                });
                
            }
            
        }
    )
    

})
app.get("/logout", function(req, res) {
    req.session.reset();
    res.redirect("/login");
  });
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
    bcrypt.hash(password, 10).then(hash => {
        let Users = db.model("Users", UsersSchema);
        let regterUser = new Users({
            email: email,
            password: hash,
            fname: fname,
            lname: lname,
            bod: date,
            userType:0,//for regular user and 1 for admin which we already inserted from the database so that not anyone could be an administrator
        })

        regterUser.save((error) => {
            if (error) { console.log("error") }
            else {
                console.log("success");
            }

        })
    })
        .catch(err => {
            console.log(err); // Show any errors that occurred during the process
        });



    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'sadamalheraky1990@gmail.com',
            pass: 'Fatosh2000',
        }
    });

    var mailOptions = {
        from: 'sadamalheraky1990@gmail.com',
        to: email,
        subject: 'Welcome to Airbnb',
        text: 'dear ' + fname + '\nWelcome to Airbnb\n\n We are really happy to have you as a new member at our website.'
    };

    transporter.sendMail(mailOptions, function (error, info) {
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


app.listen(HTTP_PORT);