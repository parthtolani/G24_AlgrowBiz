import React, { useState, useEffect } from 'react';
import './inventoryManagement.css';
import axios from 'axios';
import config from './config.js';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]); // List of all items in inventory
  const [newProduct, setNewProduct] = useState({
    itemId: '',
    category: '',
    name: '',
    quantity: '',
    costPrice: '',
    sellingPrice: ''
  });

  const userId = localStorage.getItem('userId'); // getting user Id from local storage

  const [isEditing, setIsEditing] = useState(false); // To check if we are adding or updating a product
  const categories = ['Electronics', 'Clothes', 'Stationery', 'Groceries', 'Books', 'Furniture', 'Toys', 'Home Appliances', 'Footwear', 'Beauty & Personal Care'];
  const [selectedCategory, setSelectedCategory] = useState(''); // To filter products by category
  
  const backendUrl = config.backendUrl;

  const item_categories = {
    'Electronics': 1, 'Clothes': 2, 'Stationery': 3, 'Groceries': 4, 'Books': 5,
    'Furniture': 6, 'Toys': 7, 'Home Appliances': 8, 'Footwear': 9, 'Beauty & Personal Care': 10
  };

  const subcategoriesList = {
    1: ['Smartphone', 'Laptop', 'Smartwatch', 'Television', 'Camera'],
    2: ['Shirts', 'Pants', 'Dresses', 'Jackets', 'Socks'],
    3: ['Pens', 'Notebooks', 'Markers', 'Staplers', 'Folders'],
    4: ['Vegetables', 'Fruits', 'Snacks', 'Beverages', 'Spices'],
    5: ['Fiction', 'Non-fiction', 'Textbooks', 'Magazines', 'Comics'],
    6: ['Sofas', 'Tables', 'Chairs', 'Beds', 'Wardrobes'],
    7: ['Action Figures', 'Puzzles', 'Board Games', 'Dolls', 'Remote Control Cars'],
    8: ['Refrigerator', 'Microwave', 'Washing Machine', 'Air Conditioner', 'Vacuum Cleaner'],
    9: ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Slippers'],
    10: ['Skincare', 'Haircare', 'Makeup', 'Perfume', 'Body Lotion']
  };

  const fetchProductsByCategory = async (selectedCategory) => {
    try {
      console.log(selectedCategory);
      const response = await axios.get(`${backendUrl}/products?category=${selectedCategory}&userId=${userId}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products by category:", error);
    }
  };
  const [subcategories, setSubcategories] = useState([]);

  const handleAddProdCategory = (e) => {
    const newCategory = e.target.value;
    setNewProduct({
      ...newProduct,
      category: newCategory,  
      name: ''
    });

    const catId=item_categories[newCategory];
    setSubcategories(subcategoriesList[catId]||[]);
  };

  const handleChange = (e) => {
    if(e.target.name==="quantity" && e.target.value!=="" && isNaN(e.target.value)){
      alert("Quantity must be a number"); // alert if quantity is not a number
      return;
    }
    if(e.target.name==="quantity" && e.target.value!=="" && e.target.value<=0){
      alert("Quantity must be greater than 0");  // alert if quantity is less than or equal to 0
      return;
    }
    if(e.target.name==="costPrice" && isNaN(e.target.value)){
      alert("Cost Price must be a number"); // alert if cost price is not a number
      return;
    }
    if(e.target.name==="costPrice" && e.target.value!=="" && e.target.value<0){
      alert("Cost Price must be greater than or equal to 0"); // alert if cost price is less than 0
      return;
    }
    if(e.target.name==="sellingPrice" && isNaN(e.target.value)){
      alert("Selling Price must be a number");  // alert if selling price is not a number
      return;
    }
    if(e.target.name==="sellingPrice" && e.target.value!=="" && e.target.value<0){
      alert("Selling Price must be greater than or equal to 0"); // alert if selling price is less than 0
      return;
    }

    setNewProduct({
      ...newProduct,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    console.log(selectedCategory);
    fetchProductsByCategory(newCategory);
  };

  const addOrUpdateProduct = async () => {
    if (!newProduct.category || !newProduct.name || !newProduct.quantity || !newProduct.costPrice || !newProduct.sellingPrice) {
      alert("Please fill in all the fields or check if the entered fields are valid");
      return;
    }
    try {
      if (isEditing) {
        // Update product in backend
        // await axios.put(http://127.0.0.1:5000/inventory/modify?itemId=${newProduct.itemId}, newProduct);    //// optional
        await axios.put(`${backendUrl}/inventory/modify?userId=${userId}`, newProduct);
        setIsEditing(false);
      } else {
        //adding a new product
        await axios.post(`${backendUrl}/inventory/insert?userId=${userId}`, newProduct);
      }
      setNewProduct({ itemId: '', category: '', name: '', quantity: '', costPrice: '', sellingPrice: '' });
      fetchProductsByCategory(selectedCategory);
    } catch (error) {
      console.error("Error adding/updating product:", error);
    }
  };

  const deleteProduct = async (itemId) => {
    try {
      await axios.delete(`${backendUrl}/inventory/delete?itemId=${itemId}&userId=${userId}`);
      fetchProductsByCategory(selectedCategory);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // Set up modify product
  const modifyProduct = (product) => {
    setNewProduct(product);
    setIsEditing(true);
  };

  return (
    <>
    <div className='inventory-title'>
      <h2>Inventory Management</h2>
    </div>
    <div className="inventory-container">
      {/* Add/Update Product Form */}
      <div className="form-container">
  <h3>{isEditing ? 'Edit Product' : 'Add Product'}</h3>
  <div className="form-row">
    <input
      type="text"
      name="itemId"
      placeholder="Item ID"
      value={newProduct.itemId}
      onChange={handleChange}
      required
      disabled={isEditing}
    />
    <select
      name="category"
      value={newProduct.category}
      onChange={handleAddProdCategory}
      required
    >
      <option value="" disabled>Select Category</option>
      {categories.map((cat, i) => (
        <option key={i} value={cat}>{cat}</option>
      ))}
    </select>
  </div>
  <div className="form-row">
    <select
      name="name"
      value={newProduct.name}
      onChange={handleChange}
      required
    >
      <option value="" disabled>Select Product Name</option>
      {subcategories.map((subCategory, index) => (
        <option key={index} value={subCategory}>{subCategory}</option>
      ))}
    </select>
    <input
      type="number"
      name="quantity"
      placeholder="Quantity"
      value={newProduct.quantity}
      onChange={handleChange}
      required
    />
  </div>
  <div className="form-row">
    <input
      type="number"
      name="costPrice"
      placeholder="Cost Price"
      value={newProduct.costPrice}
      onChange={handleChange}
      required
    />
    <input
      type="number"
      name="sellingPrice"
      placeholder="Selling Price"
      value={newProduct.sellingPrice}
      onChange={handleChange}
      required
    />
  </div>
  <button onClick={addOrUpdateProduct}>{isEditing ? 'Update' : 'Add'}</button>
</div>

      {/* Product List */}
      <div className="product-list">
        <h3>Inventory List</h3>
        <div className="category-filter">
            <select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="">Filter by Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        {/* {products.length === 0 ? (
          <p>No products in inventory.</p>
        ) : ( */}
          <table>
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Category</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.itemId}>
                  <td>{product.itemId}</td>
                  <td>{product.category}</td>
                  <td>{product.name}</td>
                  <td>{product.quantity}</td>
                  <td>{product.costPrice}</td>
                  <td>{product.sellingPrice}</td>
                  <td>
                    <button onClick={() => modifyProduct(product)}>Modify</button>
                    <button onClick={() => deleteProduct(product.itemId)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        {/* )} */}
      </div>
    </div>
    </>
  );
};

export default InventoryManagement;
