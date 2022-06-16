const User = require('../models/User');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const {OAuth2Client, UserRefreshClient} = require('google-auth-library')

dotenv.config();


const router = require('express').Router();

const oAuth2Client = new OAuth2Client (
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'postmessage'
);

//REGISTER
router.post('/register', async (req,res)=>{
    const newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email:req.body.email,
        password: CryptoJS.AES.encrypt(req.body.password, process.env.PASS_SEC).toString(),
        isAdmin: req.body.isAdmin,
        profileImg: req.body.profileImg
    })

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    }   catch (err) {
        res.status(500).json(err);
    }
});

//LOGIN

router.post('/login', async (req,res)=> {
    try {
        const user = await User.findOne({email: req.body.email});
        if(!user) { 
            return res.status(401).json("Wrong credentials!");
        }

        const hashedPassword = CryptoJS.AES.decrypt(
            user.password, 
            process.env.PASS_SEC
        );
        const OriginalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
        if(OriginalPassword !== req.body.password) { 
            return res.status(401).json("Wrong credentials!");
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
                isAdmin: user.isAdmin
            },
            process.env.JWT_SEC,
            {expiresIn:"3d"}
        );

        const { password, ...others } = user._doc;
        res.status(200).json({...others, accessToken});
    }   catch (err) {
        res.status(500).json(err);
    }
})

//Google authentication and authorization
router.post('/google', async (req, res)=> {
    try {
        const {tokens} = await oAuth2Client.getToken(req.body.code);
        res.status(200).json(tokens)
    } catch (err) {
        res.status(500).json(err);
        console.log(err)
    }
});

router.post('/google/refresh-token', async (req, res)=> {
    const user = new UserRefreshClient(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        req.body.refreshToken
    );
    try {
        const { credentials } = await user.refreshAccessToken();
        res.status(200).json(credentials)
    } catch (err) {
        res.status(500).json(err)
        console.log(err)
    }
})

//ADMIN LOGIN

router.post('/adminlogin', async (req,res)=> {
    try {
        const user = await User.findOne({email: req.body.email});
        if(!user) { 
            return res.status(401).json("Wrong credentials!");
        }
        if(user.isAdmin == false) {
            return res.status(401).json("Not authorized")
        }

        const hashedPassword = CryptoJS.AES.decrypt(
            user.password, 
            process.env.PASS_SEC
        );
        const OriginalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
        if(OriginalPassword !== req.body.password) { 
            return res.status(401).json("Wrong credentials!");
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
                isAdmin: user.isAdmin
            },
            process.env.JWT_SEC,
            {expiresIn:"3d"}
        );

        const {password, ...others } = user._doc;
        res.status(200).json({...others, accessToken});
    }   catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router;