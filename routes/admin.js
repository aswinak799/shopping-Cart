const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelprs=require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');

/* GET users listing. */
const verifyLogin=(req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin/admin-login')
  }
}

router.get('/',verifyLogin,function(req, res, next) {
  productHelprs.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products,user:true})

  })
  
  
  
});
router.get('/add-product',verifyLogin,function(req,res){
  res.render('admin/add-product',{admin:true})

})

router.post('/add-product',(req,res)=>{
  console.log(req.body);
  // console.log(req.files.image);
  req.body.price=parseInt(req.body.price)
  console.log('after change');
  console.log(req.body);

  productHelprs.addProduct(req.body,(result)=>{
    
    let image=req.files.image
    console.log(result)
   
    image.mv('./public/product-images/'+result+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-product",{admin:true})
      }else{
        console.log(err)
      }
    })
    
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  // console.log(proId)
  productHelprs.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
  // console.log(req.query.name)
  // res.redirect('/')


})
router.get('/edit-product/:id',verifyLogin,async (req,res)=>{
  let product=await productHelprs.getProductsDetails(req.params.id)
  console.log(product)
res.render('admin/edit-product',{product,admin:true})


})
router.post('/edit-product/:id',(req,res)=>{
  productHelprs.editProduct(req.params.id,req.body).then((data)=>{
    // console.log(data)
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+req.params.id+'.jpg')
    }
  })
})
// router.get('/admin-login',(req,res)=>{
//   res.render('admin/login',{admin:true})
// })



router.get('/admin-login',(req,res)=>{
  console.log(req.session.admin);
  if(req.session.admin){
    res.redirect('/admin')
  }else{

    res.render('admin/login',{'loggedInErr':req.session.adminloggedInErr,admin:true})
    req.session.adminloggedInErr=false
  }
 
})
router.post('/admin-login',(req,res)=>{
  console.log(req.body)
  productHelprs.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.admin=response.admin
      req.session.admin.loggedIn=true
      res.redirect('/admin')
    }else{
      req.session.adminloggedInErr=true
      res.redirect('/admin/admin-login')
    }
  })

})
router.get('/admin-logout',(req,res)=>{
  req.session.admin=null
  // req.session.destroy()
  res.redirect('/admin/admin-login')

})
router.get('/all-users',verifyLogin,(req,res)=>{
  userHelpers.getAllUsers().then((response)=>{
    console.log(response)
    res.render('admin/all-users',{response,admin:true})
  })
  
})
router.get('/remove-user/:id',(req,res)=>{
  userHelpers.removeUser(req.params.id).then((response)=>{
    
    res.json(response)
  })
})
router.get('/view-orders',(req,res)=>{
  productHelprs.getAllOrders().then(()=>{
    
  })
  res.render('admin/all-orders')
})
module.exports = router;