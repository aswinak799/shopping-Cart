function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        methord:'get',
        success:(response)=>{
            if(response.status){
               let count=$('#cart-count').html()
               count=parseInt(count)+1
               $("#cart-count").html(count)
               console.log(response.status) 
            }else{
              alert('please login')
              location.reload()
            }
            
        }
    })
}

function changeQuantity(cartId,proId,user,count){
  let Quantity=parseInt(document.getElementById(proId).innerHTML)
  count=parseInt(count)
    
    $.ajax({
      url:'/change-product-quantity',
      data:{
        cart:cartId,
        product:proId,
        user:user,
        count:count,
        Quantity:Quantity
      },
      method:'post',
      success:(response)=>{
        if(response.removeProduct){
          alert("product removed from the cart")
          location.reload()
        }
        else{
          document.getElementById(proId).innerHTML=Quantity+count;
          document.getElementById('total').innerHTML=response.amount;

        }
        
        
      }
    })
  }
  
  
