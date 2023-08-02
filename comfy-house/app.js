// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartContent = document.querySelector(".cart-content");
const cartItems= document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const productsDOM = document.querySelector(".products-center");

// cart 
let cart = [];

// buttons
let buttonsDOM;

// getting the products first from JSON and then with contentful via AJAX request
class Products {
    // method
    async getProducts() {
        // use fetch method and it has a url parameter
        // get products.json
        try {
            // async await will always return promise, await - will wait until the promised is returned
            let result = await fetch("./products.json");
            let data = await result.json();
            let products = data.items;
            // only when the fetch is settled, then we will return the result
            products = products.map(item=>{
                const {title,price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title, price, id, image};
            })
            return products;
        } catch (error) {
            console.log(error);
        }
        // use try and catch
    }
}

// display products
class UI {
    // this will have bulk of the methods
    displayProducts(products){
        let result = '';
        products.forEach(product => {
            result += `<!-- single product -->
                <article class="product">
                <div class="img-container">
                <img src=${product.image} alt="product" class = "product-img"/>
                <button class = "bag-btn" data-id = ${product.id}>
                <i class="fas fa-shopping-cart"></i>
                add to cart
                </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
                </article>
                <!-- end of single product -->`;
        });
        productsDOM.innerHTML = result;
    }

    getBagButtons(){
        // turn it into an array
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === id);
            
            if(inCart){
                button.innerText = "In Cart";
                button.disabled = true;
            }else{
                button.addEventListener("click", event => {
                event.target.innerText = "In Cart";
                button.disabled = true;
                // get product from products based on the id we will get from the button
                let cartItem = {...Storage.getProduct(id), amount: 1};
                // add product to the cart
                cart = [...cart,cartItem];
                // save cart in the local storage
                Storage.saveCart(cart);
                // set the cart values 
                this.setCartVal(cart);
                // display cart item
                this.addCartItem(cartItem);
                // show the cart
                this.showCart();
            });
            }    
        })
    }

    setCartVal(cart){
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item=>{
            tempTotal += item.price*item.amount;
            itemsTotal += item.amount;
        })
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }

    addCartItem(item){
        const div = document.createElement('div');
        div.classList.add("cart-item");
        div.innerHTML = `<img src=${item.image} alt="">
                                <div>
                                    <h4>${item.title}</h4>
                                    <h5>${item.price}</h5>
                                    <span class ="remove-item" data-id = ${item.id}>remove</span>
                                </div>
                                <div>
                                    <i class="fas fa-chevron-up" data-id = ${item.id}></i>
                                    <p class="item-amount">${item.amount}</p>
                                    <i class="fas fa-chevron-down" data-id = ${item.id}></i>
                                </div>`;
        cartContent.appendChild(div);  
        console.log("#",cartContent.parentElement.parentElement);         
    }

    showCart(){
        console.log("enter-show cart");
        cartOverlay.classList.add('transparentBcg');
        console.log(cartOverlay);
        console.log(cartOverlay.parentElement);
        cartDOM.classList.add('showCart');
    }

    setupAPP(){
        cart = Storage.getCart();
        this.setCartVal(cart);
        this.populateCart(cart);
        cartBtn.addEventListener('click',this.showCart);
        closeCartBtn.addEventListener('click',this.hideCart);
    }

    hideCart(){
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    };

    populateCart(cart){
        cart.forEach(item=>this.addCartItem(item));
    }

    cartLogic(){
        //clear cart button
        clearCartBtn.addEventListener('click',()=>{
            this.clearCart();
        });
    
        cartContent.addEventListener('click', event=>{
            if (event.target.classList.contains('remove-item')){
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            }else if (event.target.classList.contains("fa-chevron-up")){
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartVal(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            }else if (event.target.classList.contains("fa-chevron-down")){
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                if (tempItem.amount > 0){
                    Storage.saveCart(cart);
                    this.setCartVal(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                }else{
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
                
                
            }
        })
    }

    clearCart(){
        let cartItems = cart.map(item=>item.id);
        cartItems.forEach(id=>this.removeItem(id));
        while (cartContent.children.length>0){
            cartContent.removeChild(cartContent.children[0]);
            }
            this.hideCart();
    }
    removeItem(id){
        cart = cart.filter(item => item.id !== id);
        this.setCartVal(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class = "fas fa-shopping-cart"></i>add to cart`;
    }

    getSingleButton(id){
        return buttonsDOM.find(button=>button.dataset.id === id);
    }

}

// local storage 
class Storage {
    // create a static method - we can use it without instantiating the class
    static saveProducts(products){
        // access the local storage and use setItem method and specify key value pair
        // need to save it as a string
        localStorage.setItem("products", JSON.stringify(products))
    }

    static saveCart(cart){
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    static getProduct(id){
        // return the array I have in local storage
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }
    static getCart(){
        return localStorage.getItem('cart')?JSON.parse(localStorage.getItem('cart')): []
    }
}

document.addEventListener("DOMContentLoaded", ()=> {
    // create instances of products and UI classes
    const ui = new UI();
    const products = new Products();

    // setup app
    ui.setupAPP();

    // get all products
    products.getProducts().then(products => {
        ui.displayProducts(products)
        Storage.saveProducts(products);
    }).then(()=>{
        ui.getBagButtons();
        ui.cartLogic();
    });

});





