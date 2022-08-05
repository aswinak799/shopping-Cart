var db=require("../config/connection")
var collection=require('../config/collections')
const bcrypt =require('bcrypt')
const { ObjectID } = require("bson")
const { response } = require("express")
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_RDsdaax6UE4Dlk',
    key_secret: 'BA4UgUCtVEmV1wImHL0h2vTr',
  });
  


module.exports={
    doSignup:(userData)=>{
        
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                //console.log(data)
                 resolve(data)

            })

           
    
            
        })
       
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            // console.log(user.Email)
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log('success')

                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log('faild')
                        resolve({status:false})
                    }
                })

            }else{
                console.log('faild')
                resolve({status:false})
            }
        })
    },
    getUserData:(userID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectID(userID)}).then((userData)=>{
                resolve(userData)
            })
        })
    },
    addToCart:(proId,userID)=>{
        let proObj={
            item:ObjectID(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userID)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).
                    updateOne({user:ObjectID(userID),'products.item':ObjectID(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }
                else{

                        db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectID(userID)},
                        {
                            
                                $push:{products:proObj}
                            
                        }).then((response)=>{
                            resolve()
                        })
                        }

            }else{
                let cartObj={
                    user:ObjectID(userID),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectID(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                
            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)
        })
    },
    getCartCount:(userID)=>{
        return new Promise(async(resolve, reject) => {
            count=0
            let Cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userID)})
            if(Cart){
                count=Cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(data)=>{
        count=parseInt(data.count)
        Quantity=parseInt(data.Quantity)

        return new Promise((resolve, reject) => {
            if(count==-1 && Quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectID(data.cart)},
                {
                    $pull:{products:{item:ObjectID(data.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }
            else{
                db.get().collection(collection.CART_COLLECTION).
                updateOne({_id:ObjectID(data.cart),'products.item':ObjectID(data.product)},
                {
                    $inc:{'products.$.quantity':count}
                }
                ).then((response)=>{
                    // console.log(response)
                    resolve({removeProduct:false})
                })

            }

          
        })

    },
    removeProductInCart:(proId,cartId)=>{
        console.log(cartId)
        console.log(proId)
      return new Promise((resolve, reject) => {
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectID(cartId)},
        {
            $pull:{products:{item:ObjectID(proId)}}
        }
        ).then((response)=>{
        // console.log(response)
            resolve(response)
        })
      })  
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let Total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectID(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{

                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.price']}}
                    },
                }
                
            ]).toArray()
            console.log()
            if(Total.length===0) resolve(0)
             else resolve(Total[0].total)   
        })

    },
    placeOrder:(orders,products,total)=>{
        return new Promise((resolve, reject) => {
           
            let status=orders['payment-methord']==='COD'?'placed':'pending'

            let orderObj={
                deliveryDetails:{
                    Mobile:orders.Mobile,
                    address:orders.address,
                    pincode:orders.pin
                },
                userID:ObjectID(orders.userID),
                paymentMethord:orders['payment-methord'],
                products:products,
                totalAmount:total,
                date:new Date(),
                status:status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectID(orders.userID)})
                resolve(response.insertedId)
               
            })
        })
        

    },
    getCartProductsList:(userID)=>{
        return new Promise(async(resolve, reject) => {
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userID)})
            resolve(cart.products)
        })
    },
    getUserOrders:(userID)=>{
        return new Promise(async(resolve, reject) => {
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userID:ObjectID(userID)}).toArray()
            //console.log(orders);
            resolve(orders)
        })
    },
    getOrderproduct:(orderID)=>{
        return new Promise(async(resolve, reject) => {
            let products=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectID(orderID)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        _id:0,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                
            ]).toArray()
            console.log(products)
            resolve(products)
        })
    },
    generateRazorpay:(orderID,total)=>{
        return new Promise((resolve, reject) => {
            var options = {
                amount: total*100,
                currency: "INR",
                receipt:''+orderID
            };

           
            instance.orders.create(options,(err,order)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log('new order:',order);
                    resolve(order)
                }
                
            })
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256','BA4UgUCtVEmV1wImHL0h2vTr')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderID)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectID(orderID)},
            
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    getAllUsers:()=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).find().toArray().then((response)=>{
                resolve(response)
            })
        })
    },
    removeUser:(userID)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:ObjectID(userID)}).then((response)=>{
               
                resolve({status:true})
            })
        })
    }

}