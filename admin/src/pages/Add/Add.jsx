import React, { useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Add = ({ url }) => {
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Salad',
  })

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    setImage(file || null)
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    const priceNum = Number(data.price)
    if (!data.name.trim()) return toast.error('Please enter product name')
    if (!data.description.trim()) return toast.error('Please enter product description')
    if (Number.isNaN(priceNum) || priceNum <= 0) return toast.error('Price must be a positive number')
    if (!image) return toast.error('Please upload an image')

    const confirmText =
      `Add New Product?\n\n` +
      `Name: ${data.name}\n` +
      `Category: ${data.category}\n` +
      `Price: $${priceNum}\n`
    if (!window.confirm(confirmText)) return

    const formData = new FormData()
    formData.append('name', data.name.trim())
    formData.append('description', data.description.trim())
    formData.append('price', priceNum)
    formData.append('category', data.category)
    formData.append('image', image)

    setLoading(true)
    try {
      const response = await axios.post(`${url}/api/food/add`, formData)
      if (response.data?.success) {
        setData({ name: '', description: '', price: '', category: 'Salad' })
        setImage(null)
        toast.success(response.data.message || 'Added')
      } else {
        toast.error(response.data?.message || 'Add failed')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add">
      <form className="add-form" onSubmit={onSubmitHandler}>
        <div className="add-section">
          <div className="add-img-upload">
            <p className="label">Upload Image</p>
            <label htmlFor="image" className="upload-box" title="Upload Product Image">
              <img
                className="preview"
                src={image ? URL.createObjectURL(image) : assets.upload_area}
                alt="Preview"
              />
            </label>
            <input
              onChange={onFileChange}
              type="file"
              id="image"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              required
            />
            <small className="hint">PNG/JPG up to ~2MB</small>
          </div>

          <div className="add-fields">
            <div className="add-product-name">
              <p className="label">Product Name</p>
              <input
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                name="name"
                placeholder="Type here"
                required
              />
            </div>

            <div className="add-product-description">
              <p className="label">Product Description</p>
              <textarea
                onChange={onChangeHandler}
                value={data.description}
                name="description"
                rows="6"
                placeholder="Write content here"
                required
              />
            </div>

            <div className="add-category-price">
              <div className="add-category">
                <p className="label">Product Category</p>
                <select
                  className="selectt"
                  onChange={onChangeHandler}
                  name="category"
                  value={data.category}
                >
                  <option value="Salad">Salad</option>
                  <option value="Rolls">Rolls</option>
                  <option value="Deserts">Deserts</option>
                  <option value="Sandwich">Sandwich</option>
                  <option value="Cake">Cake</option>
                  <option value="Pure Veg">Pure Veg</option>
                  <option value="Pasta">Pasta</option>
                  <option value="Noodles">Noodles</option>
                </select>
              </div>

              <div className="add-price">
                <p className="label">Product Price</p>
                <input
                  className="inputclasa"
                  onChange={onChangeHandler}
                  value={data.price}
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  placeholder="$20"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="add-btn" disabled={loading}>
          {loading ? 'ADDING...' : 'ADD'}
        </button>
      </form>
    </div>
  )
}

export default Add
