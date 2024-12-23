from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime
import random, time
import psycopg2
from flask_mail import Mail, Message
from Sales_pred_func import sales_prediction
# Initialize Flask app
app = Flask(__name__)

# CORS(app)
CORS(app, origins=["http://localhost:3000"])

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'testing6864@gmail.com'  # Replace with your email
# app.config['MAIL_PASSWORD'] = 'test@6864'   # Replace with your email password
app.config['MAIL_PASSWORD'] = 'gmwn xmep lrlt cenc'
mail = Mail(app)

base_dir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://database_owner:gY3Xv4kBxVyw@ep-little-tooth-a1ohlzy4.ap-southeast-1.aws.neon.tech/database?sslmode=require'

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Temporary in-memory store for email-verification code mapping
verification_data = {}

# Define databases
class Credentials(db.Model):
    __tablename__ = "Credentials"
    userId = db.Column('userId', db.Integer, primary_key = True, autoincrement = True)
    userName = db.Column('userName', db.Text, nullable = False) 
    email = db.Column('email', db.Text, nullable = False)  
    password = db.Column('password', db.Text, nullable = False)  
    date = db.Column('date',db.String(12), nullable = False)

class CustomerInfo(db.Model):
    __tablename__ = "CustomerInfo"
    userId = db.Column('userId', db.Integer, primary_key = True)
    companyName = db.Column('companyName', db.Text, nullable = False)
    state = db.Column('state', db.Text, nullable = False)
    mobileNumber = db.Column('mobileNumber', db.String(15), nullable = False)
    city = db.Column('city', db.Text, nullable = False)
    
    # Relationship to UserCategories
    categories = db.relationship("UserCategories", back_populates="customer", cascade="all, delete", lazy=True)

class UserCategories(db.Model):
    __tablename__ = "UserCategories"
    userId = db.Column('userId', db.Integer, db.ForeignKey("CustomerInfo.userId"), primary_key = True)
    categoryName = db.Column('categoryName', db.Text, primary_key = True)
    
    # Relationship to CustomerInfo
    customer = db.relationship("CustomerInfo", back_populates="categories")

class Trends(db.Model):
    __tablename__ = "Trends"
    categoryId = db.Column('categoryId', db.Integer, primary_key = True, autoincrement = True)
    categoryName = db.Column('categoryName', db.Text, nullable = False)
    state = db.Column('state', db.Text, nullable = False)
    itemName = db.Column('itemName', db.Text, nullable = False)
    sales = db.Column('sales', db.Integer, nullable = False)

class Inventory(db.Model):
    __tablename__ = "Inventory"
    userId = db.Column('userId', db.Integer, primary_key = True)
    itemId = db.Column('itemId', db.Text, primary_key = True)
    itemName = db.Column('itemName', db.Text, nullable = False)
    quantity = db.Column('quantity', db.Integer, nullable = False)
    categoryName = db.Column('categoryName', db.Text, nullable = False)
    costPrice = db.Column('costPrice', db.Integer, nullable = False)
    sellingPrice = db.Column('sellingPrice', db.Integer, nullable = False)

class userHistory(db.Model):
    __tablename__ = 'userHistory'

    hId = db.Column('hId',db.Integer(),autoincrement=True,primary_key=True)

    userId = db.Column('userId',db.Integer(),nullable=False)
    date = db.Column('date',db.String(10),nullable=False)
    budget = db.Column('budget',db.Integer(),nullable=False)
    months = db.Column('months',db.Integer(),nullable=False)
    state = db.Column('state',db.String(20),nullable=False)
    profit = db.Column('profit',db.Integer(),nullable=False)

    products = db.relationship('userHistoryProducts', backref='user_history', lazy=True, cascade="all, delete-orphan")


class userHistoryProducts(db.Model):
    __tablename__ = 'userHistoryProducts'

    hId = db.Column('hId',db.Integer(),db.ForeignKey(userHistory.hId),primary_key=True)                             

    subcategory = db.Column('subcategory',db.String(20),primary_key=True)
    category = db.Column('category',db.String(20),nullable=False)
    quantity = db.Column('quantity',db.Integer(),nullable=False)

# Signup route for creating a new user
@app.route('/signup', methods=['POST','GET'])
def signup():
    try:
        data = request.json
        userName = data.get('userName')
        email = data.get('email')
        password = data.get('password')

        # Check if the email already exists
        existing_user = Credentials.query.filter_by(email=email).first()
        if existing_user:
            app.logger.debug(f"Email already in use: {email}")
            return jsonify({'message': 'Email already in use.'}), 400

        if len(password) < 6 or len(password) > 12:
            return jsonify({"message": "Password must be between 6 to 12 characters"}), 400

        if not re.fullmatch(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$&])[A-Za-z\d@#$&]{6,}$', password):
            return jsonify({
                'message': 'Password must be at least 6 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character (@, #, $, or &).'
            }), 400    
        
        # Hash the password and create a new user
        hashedPassword = generate_password_hash(password)
        newUser = Credentials(userName=userName, email=email, password= hashedPassword, date=datetime.now())
        # Add the new user to the database
        db.session.add(newUser)
        db.session.commit()
        user = Credentials.query.filter_by(email=email).first()

        # Return success response
        # app.logger.debug(f"New user created: {userName}, {email}")
        return jsonify({'message': 'User created successfully!','userId' : user.userId}), 200

    except Exception as e:
        db.session.rollback()  # Rollback if there's an error
        app.logger.error(f"Error during signup: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500
    
    
# Route to handle login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    # Here we find user by email from database
    user = Credentials.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        # User login successful
        # app.logger.info(f"User login: {user.userName}, {user.email}")
        return jsonify({"message": "Login successfully", "username": user.userName, "email": user.email,  "userId" : user.userId}), 200
    else:
        # Invalid credentials
        return jsonify({"message": "Invalid email or password"}), 400

# Route to request change the password
@app.route('/forgotPassword', methods=['POST'])
def forgotPassword():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required."}), 400

    # Generate a random 6-digit verification code
    verificationCode = f"{random.randint(100000, 999999)}"

    # Save the verification code with a timestamp (valid for 10 minutes)
    verification_data[email] = {
        "code": verificationCode,
        "timestamp": time.time()
    }
    # Check if user exists
    user = Credentials.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not exist with this email"}), 404

    # Send email with 6 digit verification code
    try:
        msg = Message("Your Password Reset Code - Team AlgrowBiz", sender="testing6864@gmail.com", recipients=[email])
        msg.body = f"Your verification code is : {verificationCode}. This code is valid for 10 minutes."
        mail.send(msg)
        return jsonify({"message": "Password reset email sent"}), 200
    except Exception as e:
        return jsonify({"message": "Failed to send email", "error": str(e)}), 500

@app.route('/verifyCode', methods=['POST'])
def verifyCode():
    data = request.get_json()
    email = data.get('email')
    code = data.get('verificationCode')

    if not email or not code:
        return jsonify({"message": "Email and verification code are required."}), 400

    # Check if the email exists in the verification data
    if email not in verification_data:
        return jsonify({"message": "Invalid email or verification code."}), 400

    stored_data = verification_data[email]
    stored_code = stored_data.get("code")
    timestamp = stored_data.get("timestamp")

    # Check if the code is valid and not expired (10 minutes)
    if stored_code == code and time.time() - timestamp <= 600:
        # Remove the data after successful verification
        del verification_data[email]
        return jsonify({"message": "Code verified successfully."}), 200
    else:
        return jsonify({"message": "Invalid or expired verification code."}), 400

# Route to reset the password
@app.route('/resetPassword', methods=['POST', 'GET'])
def resetPassword():
    data = request.json
    email = data.get('email')
    newPassword = data.get('newPassword')

    if not re.fullmatch(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$&])[A-Za-z\d@#$&]{6,}$', newPassword):
            return jsonify({
                'message': 'Password must be at least 6 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character (@, #, $, or &).'
            }), 400

    # Find user by email and update password
    user = Credentials.query.filter_by(email = email).first()
    if not user:
        return jsonify({"message": "User not exist with this email"}), 404

    # Hash the password and update user password
    hashedPassword = generate_password_hash(newPassword)
    user.password = hashedPassword
    db.session.commit()
    return jsonify({"message": "Password has been reset successfully"}), 200

@app.route('/initForm', methods=['POST', 'GET'])
def initForm():
    try:
        userId = request.args.get('userId')
        # Get the JSON data from the request
        data = request.json
        companyName = data.get('companyName')
        state = data.get('state')
        prodCategories = data.get('prodCategories')  # Assuming this is a list or dictionary
        
        prodCategories = ", ".join(prodCategories)    
        
        # Create a new CustomerInfo entry
        newCustomer = CustomerInfo(
            userId = userId,
            companyName = companyName,
            state = state,
            prodCategories = prodCategories
        )

        # Add the entry to the database
        db.session.add(newCustomer)
        db.session.commit()
        return jsonify({'message': 'Customer information added successfully!'}), 200

    except Exception as e:
        app.logger.error(f"Error adding customer: {str(e)}")
        return jsonify({'message': 'Failed to add customer information.'}), 500

def get_top_5_sales(cat_name, state):
    # Query to filter by categoryName and state, then order by sales in descending order
    top_5 = Trends.query.filter_by(categoryName=cat_name, state=state).order_by(Trends.sales.desc()).limit(5).all()
    
    # Return the top 5 results as a list of dictionaries
    result = []
    for item in top_5:
        result.append({
            'categoryName': item.categoryName,
            'itemName': item.itemName,
            'state': item.state,
            'sales': item.sales
        })
    return result

@app.route('/Trends', methods = ['POST', 'GET'])
def Trends():
    try:
        data = request.json
        state = data.get('state')
        categoryName = data.get('category')
        top_5_sales = get_top_5_sales(categoryName, state)

        return jsonify(top_5_sales), 200

    except Exception as e:
        app.logger.error(f"Error finding trend: {str(e)}")
        return jsonify({'message': 'Failed to find the top trending item.'}), 500

@app.route('/inventory/insert', methods = ['POST', 'GET'])
def inventoryInsert():
    try:
        userId = request.args.get('userId')
        data = request.json
        itemId = data.get('itemId')
        itemName = data.get('name')
        categoryName = data.get('category')
        quantity = data.get('quantity')
        costPrice = data.get('costPrice')
        sellingPrice = data.get('sellingPrice')
        product = Inventory.query.filter_by(userId = userId, itemId = itemId ).first()
        if product:
            return jsonify({'message' : 'Already product exist with this itemId'}), 400
        newEntry = Inventory(userId = userId, itemId = itemId, itemName = itemName, quantity = quantity, categoryName = categoryName, costPrice = costPrice, sellingPrice = sellingPrice)
        db.session.add(newEntry)
        db.session.commit()

        return jsonify({'message' : 'Succefully entry added'}), 200

    except Exception as e:
        app.logger.error(f"Entry Didn't got inserted: {str(e)}")
        return jsonify({"message': 'Entry didn't got inserted."}), 500

@app.route('/products', methods=['GET', 'POST'])
def getProductsByCategory():
    category = request.args.get('category')
    userId = request.args.get('userId')
    
    user = CustomerInfo.query.get(userId)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Extract the list of categories the user sells
    # user_categories = [cat.categoryName for cat in user.categories]

    # Ensure the requested category is valid for this user
    # if category not in user_categories:
        # return jsonify({"error": "User does not sell the specified category"}), 400
    
    if category:
        products = Inventory.query.filter_by(userId = userId, categoryName = category).all()

        products_data = [
        {
            'itemId': product.itemId,
            'category': product.categoryName,
            'name': product.itemName,
            'quantity': product.quantity,
            'costPrice': product.costPrice,
            'sellingPrice': product.sellingPrice
        }
            for product in products
        ]
        return jsonify(products_data), 200
    else:
        return jsonify({"error": "Category not specified"}), 400

@app.route('/inventory/delete', methods = ['POST', 'GET', 'DELETE'])
def inventoryDelete():
    try:
        itemId = request.args.get('itemId') 
        userId = request.args.get('userId')
        if not itemId:
            return jsonify({"error": "itemId is required"}), 400
        entry = Inventory.query.filter_by(userId = userId, itemId = itemId).first()
        if entry:
            db.session.delete(entry)
            db.session.commit()
            return jsonify({'message' : "entry deleted successfully"}), 200
        else:
            return jsonify({'message' : "No entry found"}), 500
    
    except Exception as e:
        app.logger.error(f"Entry didn't got deleted: {str(e)}")
        return jsonify({"message': 'Entry didn't got deleted."}), 500


@app.route('/inventory/modify', methods = ['POST', 'GET', 'PUT'])
def inventoryModify():
    try:
        userId = request.args.get('userId')
        data = request.json
        itemId = data.get('itemId')
        categoryName = data.get('category')
        itemName = data.get('name')
        quantity = data.get('quantity')
        costPrice = data.get('costPrice')
        sellingPrice = data.get('sellingPrice')

        entry = Inventory.query.filter_by(userId = userId, itemId = itemId).first()
        if entry:
            entry.itemName = itemName
            entry.categoryName = categoryName
            entry.quantity = quantity
            entry.costPrice = costPrice
            entry.sellingPrice = sellingPrice
            db.session.commit()
            return jsonify({'message' : "backend is ok"}), 200     
        else:
            print(f"No entry found.")
    
    except Exception as e:
        app.logger.error(f"Entry Didn't got modified: {str(e)}")
        return jsonify({"message': 'Entry didn't got modified."}), 500

@app.route('/forecast', methods=['POST', 'GET'])
def forecast():
    try:    
        data = request.json
        state = data.get('state')
        categoryName = data.get('itemCategory')
        itemName = data.get('subCategory')
        months = data.get('months')
        prevSale = data.get('prevSale')

        # Call the ML model prediction function
        predictedSale = sales_prediction(str(state), str(categoryName), str(itemName), int(months), int(prevSale))

        return jsonify({"predictedSale" : predictedSale}), 200
    
    except Exception as e:
        app.logger.error(f"Error in forecasting: {str(e)}")
        return jsonify({'message': 'Failed to forecast'}), 500

@app.route('/saveInventoryOptimization/<userId>',methods=['POST'])
def saveHistory(userId):
    
    payload = request.get_json()

    if payload == None:
        return jsonify({'error' : 'No data provided'}),400
    
    date=datetime.today().strftime('%Y-%m-%d')
    budget = payload.get('budget')
    months = payload.get('months')
    state = payload.get('state')
    products = payload.get('products')
    optimizedInventory = payload.get('optimizedInventory')

    profit = optimizedInventory.get('profit')
    quantities = optimizedInventory.get('quantities')

    
    if(months > 12 or months < 1):
        return jsonify({'error' : 'not a valid month'}),401
    
    if(len(products) != len(quantities)):
        return jsonify({'error' : 'invalid data handeled'}),402
    
    dict = {}

    for i in range(len(products)):
        dict[products[i].get('subcategory')] = quantities[i],products[i].get('category')
    
    dict=list(dict.items())

    try: 
        with db.session.begin():

            uh = userHistory(userId=userId,profit=profit,budget=budget,months=months,state=state,date=date)

            db.session.add(uh)
            db.session.flush()

            hid = uh.hId

            for tup in dict:
                db.session.add(userHistoryProducts(hId=hid,quantity=tup[1][0],subcategory=tup[0],category=tup[1][1]))
            
            db.session.flush()
    
    except Exception as e:
        db.session.rollback()
    

    except Exception as e:
        return jsonify({'error':'not able to commit to database'}),403
    
    return jsonify({'message':'done!'}),200

@app.route('/getInventoryOptimizations/<userId>',methods=['GET'])
def getHistory(userId):
    user_history_items = userHistory.query.filter_by(userId=userId).all()
    

    data = {"list":[]}

    for item in user_history_items:

        li = []

        for p in item.products:
            li.append(
                {
                    "category": p.category,
                    "subcategory": p.subcategory,
                    "quantity" : p.quantity
                }
            )

        data['list'].append(
            {
                "date":item.date,
                "budget": item.budget,
                "months": item.months,
                "state": item.state,
                "profit": item.profit,
                "products": li
            }
        )

    # Return the data as a JSON response
    return jsonify(data)



if __name__ == '__main__':
    app.run(debug=True)    
