var express = require('express');
var router = express.Router();
var productHelprs=require('../helpers/product-helpers');
const { route } = require('./admin');
var userHelprs=require('../helpers/user-helpers');
const { response } = require('express');

const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user;
  
  let CartCount=null;
  if(req.session.user){
    console.log(req.session.user);
    CartCount=await userHelprs.getCartCount(req.session.user._id)

  }
  productHelprs.getAllProducts().then((products)=>{
    res.render('user/view-products', { products,user,CartCount});
    console.log(CartCount)

  })
  
  
});
router.get('/login',(req,res)=>{
  console.log(req.session.user);
  if(req.session.user){
    res.redirect('/')
  }else{

    res.render('user/login',{'loggedInErr':req.session.userloggedInErr})
    req.session.userloggedInErr=false
  }
  
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  // console.log(req.body)
  userHelprs.doSignup(req.body).then((data)=>{
    userHelprs.getUserData(data.insertedId).then((userData)=>{

      console.log(userData)
      req.session.user=userData
      req.session.userloggedIn=true
      
      res.redirect('/')
    })

    //console.log(data.insertedId)
   
  })
  
  
})
router.post('/login',(req,res)=>{
  console.log(req.body)
  userHelprs.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.user=response.user
      req.session.userloggedIn=true
      res.redirect('/')
    }else{
      req.session.userloggedInErr=true
      res.redirect('/login')
    }
  })

})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userloggedIn=false
  // req.session.destroy()
  res.redirect('/')

})

router.get('/cart',verifyLogin,async (req,res)=>{
  let products=await userHelprs.getCartProducts(req.session.user._id)
  let totalVAlue=await userHelprs.getTotalAmount(req.session.user._id)
  // console.log(products)
  let user=req.session.user
  if(totalVAlue===0){
    res.render('user/cart-Empty',{user,cart:'cart'})
  }else{
    res.render('user/cart',{products,user,totalVAlue,cart:'cart'})
  }
  
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  // console.log(req.params.id)
  // console.log('api call')
  // userLoggedIn=req.sessin.loggedIn
  userHelprs.addToCart(req.params.id,req.session.user._id).then(()=>{
    let status=req.session.user.loggedIn
    res.json({status})
  })

})

router.post('/change-product-quantity',(req,res)=>{
  //console.log(req.body);
  userHelprs.changeProductQuantity(req.body).then(async(response)=>{
    response.amount=await userHelprs.getTotalAmount(req.body.user)
    res.json(response)
    
  })
})
router.get('/cart/remove-cart',(req,res)=>{
  userHelprs.removeProductInCart(req.query.proId,req.query.cartId).then((response)=>{
    console.log(response)
    res.redirect('/cart')
  })
  
})
router.get('/place-order',verifyLogin,async(req,res)=>{
  let Total=await userHelprs.getTotalAmount(req.session.user._id)
  
  res.render('user/place-order',{Total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  console.log(req.body);
  let products=await userHelprs.getCartProductsList(req.body.userID)
  let totalPrice= await userHelprs.getTotalAmount(req.body.userID)
  userHelprs.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    console.log(orderId)
    if(req.body['payment-methord']==='COD'){
      res.json({cod_success:true})
    }else{
      userHelprs.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)
      })
    }
    
    
  })

  
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success')
})
router.get('/orders',async(req,res)=>{
  let orders=await userHelprs.getUserOrders(req.session.user._id)
  res.render('user/view-orders',{user:req.session.user,orders})
})
router.get('/view-order-product/:id',async(req,res)=>{
  let products=await userHelprs.getOrderproduct(req.params.id)
  res.render('user/view-order-product',{products,user:req.session.user})
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelprs.verifyPayment(req.body).then(()=>{
    userHelprs.changePaymentStatus(req.body['order[recipt]']).then(()=>{
      console.log('payment successful');
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:'payment Faild'})
  })
  
})
module.exports = router;
