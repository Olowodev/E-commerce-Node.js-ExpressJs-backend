const Order = require('../models/Order');
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin} = require('./verifyToken');

const router = require('express').Router();

//CREATE

router.post('/', verifyToken, async (req,res)=>{
    const newOrder = new Order(req.body)

    try {
        const savedOrder = await newOrder.save();
        res.status(200).json(savedOrder)
    } catch(err){
        res.status(500).json(err);
    }
})



//UPDATE
router.put('/:id', verifyTokenAndAdmin, async (req,res)=>{
    try{
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, {
            $set: req.body
        },
        {new:true}
        )
        res.status(200).json(updatedOrder)
    } catch (err) {
        res.status(500).json(err);
    }
});

//DELETE

router.delete('/:id', verifyTokenAndAdmin, async (req,res)=>{
    try{
        await Order.findByIdAndDelete(req.params.id)
        res.status(200).json("Order has been deleted...")
    } catch (err) {
        res.status(500).json(err);
    }
})

//GET USER ORDERS

router.get('/find/:userId', verifyTokenAndAuthorization, async (req,res)=> {
    try{
        const orders = await Order.find({ userId: req.params.userId});
        res.status(200).json(orders)
    } catch (err) {
        res.status(500).json(err);
    }
})

//GET ALL ORDERS

router.get('/', verifyTokenAndAdmin, async (req,res)=> {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json(err)
    }
})

router.get('/:page', verifyTokenAndAdmin, async (req, res, next) => {
    // Declaring variable
    const resPerPage = 20; // results per page
    const page = req.params.page ? req.params.page : 1; // Page
    console.log(page)
    try {

        const orders = await Order.find()
    // Find Demanded Products - Skipping page values, limit results       per page
    const foundOrders = await Order.find()
          .skip((resPerPage * page) - resPerPage)
          .limit(resPerPage);
    // Count how many products were found
    const numOfOrders = orders.length
    // Renders The Page
    res.status(200).json({
       users: foundOrders, 
       currentPage: page, 
       pages: Math.ceil(numOfOrders / resPerPage),  
       numOfResults: numOfOrders
      });
     }
     catch (err) {
      res.status(500).json(err);
    }
    });

//GET MONTHLY INCOME

router.get('/income', verifyTokenAndAdmin, async (req,res)=>{
    const date = new Date();
    const lastMonth = new Date(date.setMonth(date.getMonth() - 1))
    const previousMonth = new Date(date.setMonth(lastMonth.getMonth() - 1))

    
    try {

        const income = await Order.aggregate([
            { $match: { createdAt: { $gte: previousMonth}}},
            {
                $project: {
                    month: {$month: '$createdAt'},
                    sales: '$amount',
                },
            },
            {
                $group: {
                    _id: '$month',
                    total:{$sum: '$sales'}
                }
            }
        ])
        res.status(200).json(income)
    } catch(err) {
        res.status(500).json(err)
    }
})

module.exports = router;