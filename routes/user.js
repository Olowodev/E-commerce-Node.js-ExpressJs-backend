const {verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization} = require('./verifyToken');
const CryptoJS = require('crypto-js');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = require('express').Router();


//UPDATE
router.put('/:id',  async (req,res)=>{

    if(req.body.password) {
        req.body.password = CryptoJS.AES.encrypt(req.body.password, process.env.PASS_SEC).toString();
    }

    try {
        const updateUser = await User.findByIdAndUpdate(req.params.id, req.body, {new: true})
        const accessToken = jwt.sign(
            {
                id: updateUser._id,
                isAdmin: updateUser.isAdmin
            },
            process.env.JWT_SEC,
            {expiresIn:"3d"}
        );
        const {password, ...others} = updateUser._doc
        res.status(200).json({...others, accessToken});
    }   catch (err) {
        res.status(500).json(err);
    }


});

//DELETE

router.delete('/:id', verifyTokenAndAuthorization, async (req,res)=>{
    try{
        await User.findByIdAndDelete(req.params.id)
        res.status(200).json("User has been deleted...")
    } catch (err) {
        res.status(500).json(err);
    }
})

//GET USER

router.get('/find/:id', verifyTokenAndAdmin, async (req,res)=> {
    try{
        const user = await User.findById(req.params.id);
        const {password, ...others} = user._doc

        const hashedPassword = CryptoJS.AES.decrypt(
            user.password, 
            process.env.PASS_SEC
        );
        const OriginalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
        res.status(200).json({...others, OriginalPassword})
    } catch (err) {
        res.status(500).json(err);
    }
})

//GET ALL USER

router.get('/', verifyTokenAndAdmin, async (req,res)=> {
    const queryNew = req.query.new
    const queryPreviousWeek = req.query.pastweek
    const today = new Date()
    const last7days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last14days = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
    try{
        if (queryNew) {
            const users = await User.find({ createdAt : {$gte : last7days}})
            res.status(200).json(users)
        } else if (queryPreviousWeek) {
            const users = await User.find({ createdAt: {$gte : last14days, $lt : last7days}})
            res.status(200).json(users)
        } else {
            const users = await User.find()
            res.status(200).json(users)
        }
    } catch (err) {
        res.status(500).json(err);
    }
})

//GET ADMIN USERS
router.get('/findadmin', verifyTokenAndAdmin, async (req,res) => {
    try {
        const admins = await User.find({ isAdmin : true})
        res.status(200).json(admins)
    } catch (err) {
        res.status(500).json(err);
    }
})


router.get('/:page/:field', async (req, res, next) => {
    const field = req.params.field
    const sortQuery = req.query.sort
    // Declaring variable
    const resPerPage = 20; // results per page
    const page = req.params.page ? req.params.page : 1; // Page
    console.log(page)
    try {

        const users = await User.find()
    // Find Demanded Products - Skipping page values, limit results       per page
    const foundUsers = await User.find()
          .skip((resPerPage * page) - resPerPage)
          .limit(resPerPage)
          .sort([[ field, sortQuery]]);
    // Count how many products were found
    const numOfUsers = users.length
    // Renders The Page
    res.status(200).json({
       users: foundUsers, 
       currentPage: page, 
       pages: Math.ceil(numOfUsers / resPerPage),  
       numOfResults: numOfUsers
      });
     }
     catch (err) {
      res.status(500).json(err);
    }
    });

//GET USER STATS

router.get('/stats', verifyTokenAndAdmin, async (req,res)=>{
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1))
    
    try {

        const data = await User.aggregate([
            { $match: { createdAt: { $gte: lastYear}}},
            {
                $project: {
                    month: {$month: '$createdAt'},
                },
            },
            {
                $group: {
                    _id: '$month',
                    total:{$sum: 1}
                }
            }
        ])
        res.status(200).json(data)
    } catch(err) {
        res.status(500).json(err)
    }
})
/*router.get('/usertest', (req,res) => {
    res.send('user test is successful')
})

router.post('/userposttest', (req,res)=>{
    const username = req.body.username
    console.log(username);
    res.send('your username is:' + username);
})*/

module.exports = router