// cart.js

// Get cart from localStorage or empty
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Update cart count in header
function updateCartCount(){
    const count = cart.reduce((t,item)=> t + item.qty,0);
    const el = document.getElementById("cartCount");
    if(el) el.innerText = count;
}

// Add product to cart
async function addToCart(product){
    const existing = cart.find(p=>p.id === product.id);
    if(existing){ existing.qty += 1; }
    else { cart.push({...product, qty:1}); }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();

    // Send to backend
    try{
        await fetch("http://localhost:3000/api/cart/add", {
            method:"POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ userId:"user123", product })
        });
    }catch(err){ console.error("DB Error:", err); }

    alert(`${product.name} added to cart ✅`);
}

// Open cart page
function viewCart(){ window.location.href = "cart.html"; }

// Init count
updateCartCount();