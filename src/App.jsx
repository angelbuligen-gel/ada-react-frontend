import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL

console.log('API URL:', API_URL)

function App() {

    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem('access_token')
    )

    const handleLoginSuccess = () => {
        setIsLoggedIn(true)
    }

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setIsLoggedIn(false)
    }

    if (!isLoggedIn) {
        return (
            <LoginPage
                onLoginSuccess={handleLoginSuccess}
            />
        )
    }

    return (
        <ProductPage
            onLogout={handleLogout}
        />
    )
}


/* =========================================================
   LOGIN PAGE
   ========================================================= */

function LoginPage({ onLoginSuccess }) {

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {

        e.preventDefault()

        setLoading(true)
        setMessage('')

        try {

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            })

            const result = await response.json()

            console.log('Login response:', result)

            if (response.ok && result.status === true) {

                localStorage.setItem(
                    'access_token',
                    result.data.access_token
                )

                localStorage.setItem(
                    'refresh_token',
                    result.data.refresh_token
                )

                setMessage('Login successful!')

                onLoginSuccess()

            } else {

                setMessage(
                    result.message ||
                    'Invalid username or password.'
                )
            }

        } catch (error) {

            console.error('Login error:', error)

            setMessage(
                'Unable to connect to the LavaLust API.'
            )

        } finally {

            setLoading(false)

        }
    }

    return (
        <div className="login-page">

            <div className="login-card">

                <h1>Product Management</h1>

                <p className="login-subtitle">
                    Login to manage products
                </p>

                <form onSubmit={handleLogin}>

                    <label>
                        Username
                    </label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        placeholder="Enter username"
                        required
                    />

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Enter password"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                </form>

                {message && (
                    <div className="message">
                        {message}
                    </div>
                )}

            </div>

        </div>
    )
}


/* =========================================================
   PRODUCT PAGE
   ========================================================= */

function ProductPage({ onLogout }) {

    const [products, setProducts] = useState([])

    const [loading, setLoading] = useState(true)

    const [message, setMessage] = useState('')

    const [showForm, setShowForm] = useState(false)

    const [editingProduct, setEditingProduct] = useState(null)

    const [productName, setProductName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [quantity, setQuantity] = useState('')


    /* =====================================================
       GET PRODUCTS
       ===================================================== */

    const loadProducts = async () => {

        const token = localStorage.getItem('access_token')

        if (!token) {

            onLogout()

            return
        }

        setLoading(true)

        try {

            const response = await fetch(
                `${API_URL}/products`,
                {
                    method: 'GET',

                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (response.status === 401) {

                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')

                onLogout()

                return
            }

            const result = await response.json()

            console.log('Products response:', result)

            if (response.ok && result.status === true) {

                setProducts(result.data)

            } else {

                setMessage(
                    result.message ||
                    'Unable to load products.'
                )
            }

        } catch (error) {

            console.error(
                'Load products error:',
                error
            )

            setMessage(
                'Unable to connect to the LavaLust API.'
            )

        } finally {

            setLoading(false)

        }
    }


    /* =====================================================
       LOAD PRODUCTS WHEN PAGE OPENS
       ===================================================== */

    useEffect(() => {

        loadProducts()

    }, [])


    /* =====================================================
       CLEAR FORM
       ===================================================== */

    const clearForm = () => {

        setProductName('')
        setDescription('')
        setPrice('')
        setQuantity('')

        setEditingProduct(null)

        setShowForm(false)
    }


    /* =====================================================
       ADD PRODUCT
       ===================================================== */

    const addProduct = async (e) => {

        e.preventDefault()

        const token = localStorage.getItem('access_token')

        try {

            const response = await fetch(
                `${API_URL}/products`,
                {
                    method: 'POST',

                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        product_name: productName,
                        description: description,
                        price: Number(price),
                        quantity: Number(quantity)
                    })
                }
            )

            const result = await response.json()

            console.log(
                'Add product response:',
                result
            )

            if (response.ok && result.status === true) {

                setMessage(
                    'Product added successfully.'
                )

                clearForm()

                await loadProducts()

            } else {

                setMessage(
                    result.message ||
                    'Unable to add product.'
                )
            }

        } catch (error) {

            console.error(
                'Add product error:',
                error
            )

            setMessage(
                'Unable to connect to the LavaLust API.'
            )
        }
    }


    /* =====================================================
       START EDIT
       ===================================================== */

    const startEdit = (product) => {

        setEditingProduct(product)

        setProductName(product.product_name)
        setDescription(product.description || '')
        setPrice(product.price)
        setQuantity(product.quantity)

        setShowForm(true)

        setMessage('')
    }


    /* =====================================================
       UPDATE PRODUCT
       ===================================================== */

    const updateProduct = async (e) => {

        e.preventDefault()

        const token = localStorage.getItem('access_token')

        if (!editingProduct) {
            return
        }

        try {

            const response = await fetch(
                `${API_URL}/products/${editingProduct.id}`,
                {
                    method: 'PUT',

                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        product_name: productName,
                        description: description,
                        price: Number(price),
                        quantity: Number(quantity)
                    })
                }
            )

            const result = await response.json()

            console.log(
                'Update product response:',
                result
            )

            if (response.ok && result.status === true) {

                setMessage(
                    'Product updated successfully.'
                )

                clearForm()

                await loadProducts()

            } else {

                setMessage(
                    result.message ||
                    'Unable to update product.'
                )
            }

        } catch (error) {

            console.error(
                'Update product error:',
                error
            )

            setMessage(
                'Unable to connect to the LavaLust API.'
            )
        }
    }


    /* =====================================================
       DELETE PRODUCT
       ===================================================== */

    const deleteProduct = async (id) => {

        const confirmDelete = window.confirm(
            'Are you sure you want to delete this product?'
        )

        if (!confirmDelete) {
            return
        }

        const token = localStorage.getItem('access_token')

        try {

            const response = await fetch(
                `${API_URL}/products/${id}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                }
            )

            const result = await response.json()

            console.log(
                'Delete product response:',
                result
            )

            if (response.ok && result.status === true) {

                setMessage(
                    'Product deleted successfully.'
                )

                await loadProducts()

            } else {

                setMessage(
                    result.message ||
                    'Unable to delete product.'
                )
            }

        } catch (error) {

            console.error(
                'Delete product error:',
                error
            )

            setMessage(
                'Unable to connect to the LavaLust API.'
            )
        }
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    const logout = () => {

        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        onLogout()
    }


    /* =====================================================
       PRODUCT FORM
       ===================================================== */

    const renderProductForm = () => {

        if (!showForm) {
            return null
        }

        return (

            <div className="product-form-card">

                <h2>
                    {editingProduct
                        ? 'Edit Product'
                        : 'Add Product'}
                </h2>

                <form
                    onSubmit={
                        editingProduct
                            ? updateProduct
                            : addProduct
                    }
                >

                    <label>
                        Product Name
                    </label>

                    <input
                        type="text"
                        value={productName}
                        onChange={(e) =>
                            setProductName(e.target.value)
                        }
                        placeholder="Enter product name"
                        required
                    />

                    <label>
                        Description
                    </label>

                    <textarea
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                        placeholder="Enter product description"
                        required
                    />

                    <label>
                        Price
                    </label>

                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) =>
                            setPrice(e.target.value)
                        }
                        placeholder="Enter price"
                        required
                    />

                    <label>
                        Quantity
                    </label>

                    <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(e.target.value)
                        }
                        placeholder="Enter quantity"
                        required
                    />

                    <div className="form-buttons">

                        <button
                            type="submit"
                            className="save-button"
                        >
                            {editingProduct
                                ? 'Update Product'
                                : 'Save Product'}
                        </button>

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={clearForm}
                        >
                            Cancel
                        </button>

                    </div>

                </form>

            </div>
        )
    }


    /* =====================================================
       PRODUCT TABLE
       ===================================================== */

    return (

        <div className="product-page">

            <header className="topbar">

                <div>

                    <h1>
                        Product Management
                    </h1>

                    <span>
                        React.js + LavaLust API
                    </span>

                </div>

                <button
                    className="logout-button"
                    onClick={logout}
                >
                    Logout
                </button>

            </header>


            <main className="content">

                <div className="page-header">

                    <div>

                        <h2>
                            Products
                        </h2>

                        <p>
                            Manage your products
                            through the LavaLust API.
                        </p>

                    </div>

                    <button
                        className="add-button"
                        onClick={() => {

                            setEditingProduct(null)

                            setProductName('')
                            setDescription('')
                            setPrice('')
                            setQuantity('')

                            setMessage('')

                            setShowForm(true)
                        }}
                    >
                        + Add Product
                    </button>

                </div>


                {message && (

                    <div className="status-message">
                        {message}
                    </div>

                )}


                {renderProductForm()}


                <div className="table-card">

                    {loading ? (

                        <div className="loading">
                            Loading products...
                        </div>

                    ) : products.length === 0 ? (

                        <div className="empty">
                            No products found.
                        </div>

                    ) : (

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        ID
                                    </th>

                                    <th>
                                        Product Name
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Price
                                    </th>

                                    <th>
                                        Quantity
                                    </th>

                                    <th>
                                        Created At
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {products.map(
                                    (product) => (

                                        <tr
                                            key={product.id}
                                        >

                                            <td>
                                                {product.id}
                                            </td>

                                            <td>
                                                {product.product_name}
                                            </td>

                                            <td>
                                                {product.description}
                                            </td>

                                            <td>
                                                ₱
                                                {Number(
                                                    product.price
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                {product.quantity}
                                            </td>

                                            <td>
                                                {product.created_at}
                                            </td>

                                            <td>

                                                <div className="actions">

                                                    <button
                                                        className="edit-button"
                                                        onClick={() =>
                                                            startEdit(
                                                                product
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-button"
                                                        onClick={() =>
                                                            deleteProduct(
                                                                product.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </main>

        </div>
    )
}

export default App