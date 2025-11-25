import React, { useEffect, useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth, { buildAuthHeaders } from '../../auth/useAuth.jsx'
import useUI from '../../ui/useUI.jsx'

const Add = ({ url }) => {
  const { token, role, restaurantIds } = useAuth()
  const { t } = useUI()
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [data, setData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionVi: '',
    price: '',
    category: 'Salad',
  })

  const API_BASE = url || import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchRestaurants = async () => {
    try {
      const headers = buildAuthHeaders(token)
      const params = {};
      if (role === 'restaurantOwner' && restaurantIds?.length) {
        // backend filters via token; optional cityId can be added here
      }
      const res = await axios.get(`${API_BASE}/api/restaurant/list`, { params, headers })
      const list = res.data?.data || []
      setRestaurants(list)
      if (!selectedRestaurant && list.length) setSelectedRestaurant(list[0]._id)
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch restaurants")
    }
  }

  useEffect(() => {
    fetchRestaurants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (!selectedRestaurant) return toast.error('Please select a restaurant')
    if (!data.name.trim()) return toast.error('Please enter product name')
    if (!data.nameEn.trim()) return toast.error('Please enter English name')
    if (!data.description.trim()) return toast.error('Please enter EN description')
    if (!data.descriptionVi.trim()) return toast.error('Please enter VN description')
    if (Number.isNaN(priceNum) || priceNum <= 0) return toast.error('Price must be a positive number')
    if (!image) return toast.error('Please upload an image')

    const formData = new FormData()
    formData.append('name', data.name.trim())
    formData.append('nameEn', data.nameEn.trim())
    formData.append('description', data.description.trim())
    formData.append('descriptionVi', data.descriptionVi.trim())
    formData.append('price', priceNum)
    formData.append('category', data.category)
    formData.append('restaurantId', selectedRestaurant)
    formData.append('image', image)

    setLoading(true)
    try {
      const headers = buildAuthHeaders(token)
      const response = await axios.post(`${API_BASE}/api/food/add`, formData, { headers })
      if (response.data?.success) {
        setData({ name: '', nameEn: '', description: '', descriptionVi: '', price: '', category: 'Salad' })
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
      <div className="add-hero">
        <p className="eyebrow">{t("addItem")}</p>
        <h2>{t("addPage")}</h2>
        <p className="muted">{t("uploadImage")} + {t("category")}</p>
      </div>

      <form className="add-form" onSubmit={onSubmitHandler}>
        <div className="add-section">
          <div className="add-img-upload">
            <p className="label">{t("uploadImage")}</p>
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
              <p className="label">{t("restaurant")}</p>
              <select
                className="selectt"
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
              >
                {restaurants.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
                {!restaurants.length && <option value="">No restaurant</option>}
              </select>
            </div>

            <div className="add-product-name">
              <p className="label">{t("productNameVi")}</p>
              <input
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                name="name"
                placeholder="Tên món"
                required
              />
            </div>

            <div className="add-product-name">
              <p className="label">{t("productNameEn")}</p>
              <input
                onChange={onChangeHandler}
                value={data.nameEn}
                type="text"
                name="nameEn"
                placeholder="English name"
                required
              />
            </div>

            <div className="add-product-description">
              <p className="label">{t("descriptionEn")}</p>
              <textarea
                onChange={onChangeHandler}
                value={data.description}
                name="description"
                rows="4"
                placeholder="Write content here"
                required
              />
            </div>

            <div className="add-product-description">
              <p className="label">{t("descriptionVi")}</p>
              <textarea
                onChange={onChangeHandler}
                value={data.descriptionVi}
                name="descriptionVi"
                rows="4"
                placeholder="Mô tả tiếng Việt"
                required
              />
            </div>

            <div className="add-category-price">
              <div className="add-category">
                <p className="label">{t("category")}</p>
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
                <p className="label">{t("price")} (VND)</p>
                <input
                  className="inputclasa"
                  onChange={onChangeHandler}
                  value={data.price}
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  placeholder="55000"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="add-btn" disabled={loading}>
          {loading ? t("loading") : t("addButton")}
        </button>
      </form>
    </div>
  )
}

export default Add
