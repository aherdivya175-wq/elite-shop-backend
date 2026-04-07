from flask import Flask,request,jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

pending_products=[]
approved_products=[]

# retailer sends request
@app.route("/add_product",methods=["POST"])
def add_product():

    data=request.json
    pending_products.append(data)

    return jsonify({"message":"Product Request Sent To Admin"})


# admin sees requests
@app.route("/pending_products")
def pending_products_list():

    return jsonify(pending_products)


# admin approves
@app.route("/approve_product",methods=["POST"])
def approve_product():

    data=request.json
    sku=data["sku"]

    for p in pending_products:

        if p["sku"]==sku:

            approved_products.append(p)
            pending_products.remove(p)

            return jsonify({"message":"Product Approved"})

    return jsonify({"message":"Product Not Found"})


# admin rejects
@app.route("/reject_product",methods=["POST"])
def reject_product():

    data=request.json
    sku=data["sku"]

    for p in pending_products:

        if p["sku"]==sku:

            pending_products.remove(p)

            return jsonify({"message":"Product Rejected"})

    return jsonify({"message":"Product Not Found"})


app.run(debug=True)