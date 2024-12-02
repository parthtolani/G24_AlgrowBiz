import React, { useState, useEffect } from 'react';
import axios from 'axios';  // Ensure axios is imported
import './inventoryOptimisation.css';
import { Pie } from 'react-chartjs-2'; // Import chart components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import config from './config.js';
// import Navbar from './navbar';

ChartJS.register(CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Lakshadweep',
  'Puducherry', 'Ladakh', 'Jammu and Kashmir'
];

const prodCategories = [
  'Beauty & Personal Care', 'Books', 'Clothes', 'Electronics', 'Footwear',
  'Furniture', 'Groceries', 'Home Appliances', 'Stationery', 'Toys'
];

const subCategories = {
  Electronics : ['Smartphone', 'Laptop', 'Smartwatch', 'Television', 'Camera'],
  Clothes: ['Shirts', 'Pants', 'Dresses', 'Jackets', 'Socks'],
  Stationery : ['Pens', 'Notebooks', 'Markers', 'Staplers', 'Folders'],
  Groceries : ['Vegetables', 'Fruits', 'Snacks', 'Beverages', 'Spices'],
  Books : ['Fiction', 'Non-fiction', 'Textbooks', 'Magazines', 'Comics'],
  Furniture : ['Sofas', 'Tables', 'Chairs', 'Beds', 'Wardrobes'],
  Toys : ['Action Figures', 'Puzzles', 'Board Games', 'Dolls', 'Remote Control Cars'],
  "Home Appliances" : ['Refrigerator', 'Microwave', 'Washing Machine', 'Air Conditioner', 'Vacuum Cleaner'],
  Footwear : ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Slippers'],
  "Beauty & Personal Care" : ['Skincare', 'Haircare', 'Makeup', 'Perfume', 'Body Lotion']
}

export default function InventoryOptimisation() {
  const [budget, setBudget] = useState('');
  const [months, setMonths] = useState(1);  // Default to month 1
  const [state, setState] = useState('');
  const [numProducts, setNumProducts] = useState(1);
  const [products, setProducts] = useState([{ category: '', subcategory: '', prevSale: '', cost: '', profit: '' }]);
  const [activeProductIndex, setActiveProductIndex] = useState(null); // Track active product
  const [optimizedData, setOptimizedData] = useState(null); // Store the optimized data response
  const [option, setOption] = useState(0);
  const [isSaved, setIsSaved] = useState(false); // state to track if the data is saved
  const [history, setHistory] = useState([]); // State for history data
  const [selectedForecast, setSelectedForecast] = useState(null); // State for the selected forecast
  const [loading, setLoading] = useState(false); // Track loading state

  const backendUrl = config.backendUrl;

  // Handle number of products change, keeping old data if numProducts increases
  const handleNumProductsChange = (event) => {
    const num = parseInt(event.target.value, 10);
    setNumProducts(num);
    setProducts((prevProducts) =>
      prevProducts.slice(0, num).concat(
        Array.from({ length: Math.max(0, num - prevProducts.length) }, () => ({
          category: '',
          subcategory: '',
          prevSale: '',
          cost: '',
          profit: ''
        }))
      )
    );
  };

  // Handle individual product input change
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  // Handle click on product box to set as active
  const handleProductClick = (index) => {
    setActiveProductIndex(index); // Set the clicked product box as active
  };

  // Handle optimized inventory calculation
  const handleOptimizedInventory = async () => {
    setLoading(true); // Set loading to true
    console.log("I was clicked !"); ///////////////////////////////////////////////////////////
    try {
      const payload = {
        budget,
        months,
        state,
        products: products.map(product => ({
          category: product.category,
          subcategory: product.subcategory,
          prevSale: parseInt(product.prevSale, 10),
          cost: parseInt(product.cost, 10),
          profit: parseInt(product.profit, 10)
        }))
      };

      console.log(payload);

      // Make the API request to the backend for optimized inventory
      const response = await axios.post(`${backendUrl}/inventoryOptimization`, payload);

      console.log(response);
      
      if (response.data) {
        setOptimizedData(response.data);  // Store the optimized result
      }
    } catch (error) {
      console.error('Error in optimizing inventory:', error);
      alert('There was an error calculating the optimized inventory. Please try again.');
    }
    finally {
      setLoading(false); // Set loading to false after API call
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  const generateColors = (length) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#C9CBCF', '#61E294', '#FF6F61', '#B39CD0',
      '#51A3A3', '#DEB887', '#87CEEB', '#C71585', '#F4A460',
      '#708090', '#4682B4', '#A9A9A9', '#FF1493', '#FFD700'
    ];
    
    // If there are more data points than colors, loop over the colors
    return Array.from({ length }).map((_, index) => colors[index % colors.length]);
  };
  
  const pieData = optimizedData && {
    labels: products.map(product => product.subcategory),
    datasets: [
      {
        label: 'Optimized Inventory',
        data: optimizedData.quantity,
        backgroundColor: generateColors(optimizedData.quantity.length), // Generate dynamic colors based on data length
        hoverOffset: 4,
      }
    ]
  };  

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleOption = (value) => {
    setOption(value);
    setSelectedForecast(null); // clearing the selected forecast when switching...
  }

  const handleSave = async () => {
    const userId = localStorage.getItem('userId'); // Fetch the userId from localStorage
    try {
      const payload = {
        budget,
        months,
        state,
        products: products.map(product => ({
          category: product.category,
          subcategory: product.subcategory,
          prevSale: parseInt(product.prevSale, 10),
          cost: parseInt(product.cost, 10),
          profit: parseInt(product.profit, 10),
        })),
        optimizedInventory: optimizedData, // Include the optimized inventory data
      };

      const response = await axios.post(`${backendUrl}/saveInventoryOptimization/${userId}`, payload);


      if (response.status === 200) {
        setIsSaved(true); // Mark as saved if the request is successful
      } else {
        alert('Failed to save the data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving inventory optimization data:', error);
      alert('An error occurred while saving the data. Please try again.');
    }
  };

  const fetchHistory = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await axios.get(`${backendUrl}/getInventoryOptimizations/${userId}`);
      if (response.data && response.data.list) {
        setHistory(response.data.list);
      }
    } catch (error) {
      console.error('Error fetching optimization history:', error);
      alert('Unable to fetch optimization history. Please try again.');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleForecastClick = (forecast) => {
    setSelectedForecast(forecast);
  };

  return (
    <>
    {/* <Navbar /> */}
    <div className="optimization-div">
      <div className="optimized-text">
        <h5>Turning constraints into opportunity,</h5>
        <h5>we build the inventory that fuels success.</h5>
        <h5>Optimize today; profit tomorrow.</h5>
      </div>

      <div className="options">
        <div className={`current-optimization ${option === 0 ? "active-optimization" : ""}`} onClick={() => handleOption(0)}>
            Current Optimization
        </div>
        <div className={`previous-optimization ${option === 1 ? "active-optimization" : ""}`} onClick={() => handleOption(1)}>
            Previous Optimizations
        </div>
      </div>

      {option === 0 ? (
        <div className="form">
          <div className="input-wrapper">
            <div className="input-row">
              <label>Budget:</label>
              <input
                type="number"
                min="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                onKeyDown={(e) => e.key === '-' && e.preventDefault()}
              />
            </div>

            <div className="input-row">
              <label>Months:</label>
              <select value={months} onChange={(e) => setMonths(parseInt(e.target.value, 10))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-row">
              <label>State:</label>
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select State</option>
                {states.map((state, index) => (
                  <option key={index} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-row">
              <label>No. of Products:</label>
              <input
                type="number"
                min="1"
                value={numProducts}
                onChange={handleNumProductsChange}
              />
            </div>
          </div>

          {products.map((product, index) => (
            <div
              key={index}
              className={`product-details ${activeProductIndex === index ? 'active' : ''}`} // Add 'active' class if clicked
              onClick={() => handleProductClick(index)} // Add click handler to set active product
            >
            <div className='product-heading-div'>
              <h4 className='product-heading'>Product {index + 1}</h4>
            </div>

              <div className="input-row">
                <label>Category:</label>
                <select
                  value={product.category}
                  onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {prodCategories.map((category, i) => (
                    <option key={i} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <label>Product Name:</label>
                <select
                  value={product.subcategory}
                  onChange={(e) => handleProductChange(index, 'subcategory', e.target.value)}
                >
                  <option value="">Select Item</option>
                  {subCategories[product.category]?.map((subCategory, i) => (
                    <option key={i} value={subCategory}>
                      {subCategory}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <label>Previous Sales:</label>
                <input
                  type="number"
                  value={product.prevSale}
                  min="1"
                  onChange={(e) => handleProductChange(index, 'prevSale', e.target.value)}
                  onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                />
              </div>

              <div className="input-row">
                <label>Cost of Product:</label>
                <input
                  type="number"
                  value={product.cost}
                  min="1"
                  onChange={(e) => handleProductChange(index, 'cost', e.target.value)}
                  onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                />
              </div>

              <div className="input-row">
                <label>Profit of Product:</label>
                <input
                  type="number"
                  value={product.profit}
                  min="1"
                  onChange={(e) => handleProductChange(index, 'profit', e.target.value)}
                  onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                />
              </div>
            </div>
          ))}

          <div className="submit">
            <button onClick={handleOptimizedInventory} disabled={loading}>
              {loading ? "Processing..." : "Optimize Inventory"}
            </button>
          </div>

          {optimizedData && (
            <div className="optimized-data">
              <p className="maximum-profit-line">Maximum Profit you can achieve: {optimizedData.profit}</p>
              <div className="optimal-inventory-div">
                <p className="optimal-inventory-heading">Optimized Inventory:</p>
                <ul>
                  {optimizedData.quantity.map((item, index) => (
                    <li key={index}>
                      {products[index].subcategory}: {item} units
                    </li>
                  ))}
                </ul>

                <div className='charts'>
                  <div className="chart">
                    <h4>Visualize it !</h4>
                    <Pie data={pieData} />
                  </div>
                </div>

              </div>
              <button onClick={handleSave} disabled={isSaved} className="optimal-inventory-save">
                {isSaved ? 'Already Saved' : 'Save it'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="previous-optimizations">
            <h2>Previous Optimizations</h2>
            {history.length > 0 ? (
              <ul className="history-list">
                {history.map((forecast, index) => (
                  <li
                    key={index}
                    className="history-item"
                    onClick={() => handleForecastClick(forecast)}
                  >
                    <h3>Date: {forecast.date}</h3>
                    <p>Budget: {forecast.budget}</p>
                    <p>State: {forecast.state}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-optimizations">No previous optimizations found.</p>
            )}

            {selectedForecast && (
              <div className="forecast-details">
              <div className="forecast-details-internal-div">
                <h3>Forecast Details</h3>
                <p><strong>Date:</strong> {selectedForecast.date}</p>
                <p><strong>Budget:</strong> {selectedForecast.budget}</p>
                <p><strong>State:</strong> {selectedForecast.state}</p>
                <p><strong>Profit:</strong> {selectedForecast.profit}</p>
              </div>
                <h4>Optimized Inventory:</h4>
                <ul>
                  {selectedForecast.products.map((product, index) => (
                    <li key={index}>
                      {product.subcategory}: {product.quantity} units
                    </li>
                  ))}
                </ul>

                {selectedForecast.products.length > 0 && (
                  <div className="chart chart-prev">
                    <h4>Inventory Distribution</h4>
                    <Pie
                      data={{
                        labels: selectedForecast.products.map((product) => product.subcategory),
                        datasets: [
                          {
                            data: selectedForecast.products.map((product) => product.quantity),
                            backgroundColor: generateColors(selectedForecast.products.length),
                            hoverOffset: 4,
                          },
                        ],
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
      )}

    </div>
    </>
  );
}
