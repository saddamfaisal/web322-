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
const multer = require("multer");

require('dotenv').config();

const HTTP_PORT = process.env.PORT || 8080;


let db = mongoose.createConnection("mongodb+srv://saddam:" + "Ch3N1khsOgsgLX7k" + "@senecaweb.mbrr1.mongodb.net/" + "airbnb_db" + "?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

let UsersSchema = new Schema({
    "email": { "type": String, "unique": true, },
    "password": String,
    "fname": String,
    "lname": String,
    "bod": Date,
    "userType": Number,//for regular user and 1 for admin which we already inserted from the database so that not anyone could be an administrator
});
let RoomListingSchema = new Schema({
    "roomTitle": String,
    "price": Number,
    "description": String,
    "location": String,
    "photo": String,//url of photos
})

let BookingsSchema = new Schema({
    "userEmail": String,
    "roomId": String,
    "startDate": Date,
    "endDate": Date,

})
BookingsSchema.index({ userEmail: 1, roomId: 1, startDate: 1, endDate: 1 }, { unique: true });

app.use(clientSessions({
    cookieName: "session",
    secret: "week10example_web322",
    duration: 10 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.engine('.hbs', exphbs({
    extname: '.hbs',
    helpers: {
        mod3: function (conditional, options) {
            if (((conditional + 1) % 3) == 0) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
    }
}));
app.set('view engine', '.hbs');

app.use(express.static(path.join(__dirname, '/public')));


app.get('/', (req, res) => {
    res.render('HomePage');
})

app.get('/stylesheet.css', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/stylesheet.css'));
});

app.get('/home', (req, res) => {

    if (req.session.userType == 1) {
        let data = {
            fname: req.session.fname,
            lname: req.session.lname,
        }
        let Room = db.model("Rooms", RoomListingSchema);
        Room.find().exec().then(rooms => {
            rooms = rooms.map(value => value.toObject());

            res.render('AdminDashboard', { data: rooms, user: data });

        })
        return;

    }
    else if (req.session.userType == 0) {
        if (req.query.startDate) {

            let Booking = db.model("Bookings", BookingsSchema);
            let newBooking = new Booking({
                userEmail: req.session.email,
                roomId: req.query.id,
                startDate: req.query.startDate,
                endDate: req.query.endDate,

            })


            newBooking.save(function (error) {
                let data = {
                    email: req.session.email,
                    fname: req.session.fname,
                    lname: req.session.lname,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,

                };
                if (error) {
                    data.booked = false;
                    data.error = true;
                    console.log("error " + data.error)
                    res.render('UserDashboard', { data: data });
                    return;
                }
                else {
                    data.booked = true;
                    data.error = false;
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'sadamalheraky1990@gmail.com',
                            pass: 'Sadam1234!',
                        }
                    });

                    var mailOptions = {
                        from: 'sadamalheraky1990@gmail.com',
                        to: data.email,
                        subject: 'Booking Confirmation',
                        text: 'dear ' + data.fname + '\nThank you for choosing airbnb\n\n You have successfully booked the room between ' + data.startDate + ' and ' + data.endDate + '.'
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                            res.render('HomePage');
                        }
                    });
                    res.render('UserDashboard', { data: data });
                    return;
                }

            });

        }
        else {
            let data = {
                fname: req.session.fname,
                lname: req.session.lname,
            }

            res.render('UserDashboard', { data: data });
            return;

        }

    }
    else{
    res.render('HomePage');}

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

    let data = { username: false, password: false }
    if (username === "") {
        data.username = true;
        res.render('Login', { data: data })
    }
    if (password === "") {
        data.password = true;
        res.render('Login', { data: data })
    }

    Users.findOne({
        email: username,
    }).exec().then(

        (user) => {
            if (!user) {
                let data = { wronguser: true };
                res.render('Login', { data: data });

            }
            else {

                bcrypt.compare(password, user.password).then((result) => {
                    if (result === true) {
                        req.session.fname = user.fname;
                        req.session.lname = user.lname;
                        req.session.email = user.email;
                        req.session.userType = user.userType;
                        let data = {
                            fname: req.session.fname,
                            lname: req.session.lname,
                        }

                        if (user.userType == 1) {
                            let Room = db.model("Rooms", RoomListingSchema);
                            Room.find().exec().then(rooms => {
                                rooms = rooms.map(value => value.toObject());

                                res.render('AdminDashboard', { data: rooms, user: data });

                            })


                        }
                        else {
                            res.render('UserDashboard', { data: data });
                        }
                    }
                    else {
                        let data = { wrongpassword: true }

                        res.render('Login', { data: data });
                    }

                });

            }

        }
    )


})
app.get("/logout", function (req, res) {
    req.session.reset();
    res.redirect("/login");
});

const storage = multer.diskStorage({
    destination: "./public/Photos/",
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


const upload = multer({ storage: storage });
app.post('/upload', upload.single("photo"), (req, res) => {
    let title = req.body.roomTitle;
    let price = req.body.price;
    let description = req.body.description;
    let location = req.body.location;
    let photo = req.file.path.replace("\\", "/").substring("public".length);;
    let Room = db.model("Rooms", RoomListingSchema);
    saveRoom = new Room({
        roomTitle: title,
        price: price,
        description: description,
        location: location,
        photo: photo,
    })
    saveRoom.save((error) => {
        if (error) { console.log("error") }
        else {
            let data = {
                fname: req.session.fname,
                lname: req.session.lname,
            }
            Room.find().exec().then(rooms => {
                rooms = rooms.map(value => value.toObject());

                res.render('AdminDashboard', { data: rooms, user: data });
            });
        }

    });

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
        exists: false,

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
            userType: 0,//for regular user and 1 for admin which we already inserted from the database so that not anyone could be an administrator
        })

        regterUser.save((error) => {
            if (error) {
                console.log("error")
                data.exists = true;
                res.render('Register', { data: data })
            }
            else {
                console.log("success");
                res.render("Login")
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
            pass: 'Sadam1234!',
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
app.get('/bookingPage', (req, res) => {
    let session = req.session.userType;
    if (session == 0) {
        let id = req.query.id;
        let Room = db.model("Rooms", RoomListingSchema);
        Room.findOne({ _id: id }).exec().then(room => {
            room = room.toObject();
            res.render('BookingPage', { data: room, id: id });
            return;


        });
    }
    else {
        res.render('Login');
    }
});



app.get('/roomListing', (req, res) => {
    let searchTerm = req.query.search;
    let Room = db.model("Rooms", RoomListingSchema);

    if (searchTerm) {
        if (searchTerm == 0) {
            Room.find().exec().then(rooms => {
                rooms = rooms.map(value => value.toObject());
                res.render('RoomListingPage', { data: rooms });
                return;

            });
        }
        else if (searchTerm == 1) {
            Room.find({ location: 'Toronto' }).exec().then(rooms => {
                rooms = rooms.map(value => value.toObject());

                res.render('RoomListingPage', { data: rooms });
                return;


            });
        }
        else if (searchTerm == 2) {
            Room.find({ location: 'Vancouver' }).exec().then(rooms => {
                rooms = rooms.map(value => value.toObject());

                res.render('RoomListingPage', { data: rooms });
                return;


            });
        }
        else if (searchTerm == 3) {
            Room.find({ location: 'Ottawa' }).exec().then(rooms => {
                rooms = rooms.map(value => value.toObject());

                res.render('RoomListingPage', { data: rooms });
                return;


            });
        }

    }
    else {
        Room.find().exec().then(rooms => {
            rooms = rooms.map(value => value.toObject());
            res.render('RoomListingPage', { data: rooms });
            return;

        });
    }
});






app.post('/update', upload.single("photo"), (req, res) => {
    let id = req.body.id;
    let title = req.body.roomTitle;
    let price = req.body.price;
    let description = req.body.description;
    let location = req.body.location;
    let photo = req.file.path.replace("\\", "/").substring("public".length);;

    let Room = db.model("Rooms", RoomListingSchema);//for later
    Room.updateOne(
        { _id: id },
        {
            $set: {
                roomTitle: title,
                price: price,
                description: description,
                location: location,
                photo: photo,
            },
        },
    ).exec();
    let data = {
        fname: req.session.fname,
        lname: req.session.lname,
    }
    Room.find().exec().then(rooms => {
        rooms = rooms.map(value => value.toObject());

        res.render('AdminDashboard', { data: rooms, user: data });
    });
})


app.listen(HTTP_PORT);