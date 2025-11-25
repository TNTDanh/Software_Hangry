import axios from "axios";
import { createContext, useEffect, useState, useCallback } from "react";

export const StoreContext = createContext(null)

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});
    const url = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const [token,setToken] = useState("")
    const [userName, setUserName] = useState(
      (typeof window !== "undefined" && localStorage.getItem("userName")) || ""
    );
    const [food_list,setFoodList] = useState([])
    const [cities, setCities] = useState([])
    const [restaurants, setRestaurants] = useState([])
    const [selectedCity, setSelectedCity] = useState("all")
    const [selectedRestaurant, setSelectedRestaurant] = useState("all")
    const [lang, setLang] = useState("vi")


    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }))
        }
        else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }))
        }
        if (token){
            await axios.post(url+"/api/cart/add",{itemId},{headers:{token}})
        }
    }

    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }))
        if (token) {
            await axios.post(url+"/api/cart/remove",{itemId},{headers:{token}})
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) 
        {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item)
                if (itemInfo?.price) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }
        return totalAmount;
    }

    const fetchFoodList = useCallback(async (restaurantId, cityId) => {
        const params = {};
        if (restaurantId && restaurantId !== "all") params.restaurantId = restaurantId;
        else if (cityId && cityId !== "all") params.cityId = cityId;
        const response = await axios.get(url+"/api/food/list", { params });
        setFoodList(response.data.data || [])
    }, [url]);

    const fetchCities = useCallback(async () => {
        const res = await axios.get(url + "/api/city/list");
        const list = res.data?.data || [];
        setCities([{ _id: "all", name: "all" }, ...list]);
        if (!selectedCity) {
            setSelectedCity("all");
        }
    }, [url, selectedCity]);

    const fetchRestaurants = useCallback(async (cityId) => {
        const params = {};
        if (cityId && cityId !== "all") params.cityId = cityId;
        const res = await axios.get(url + "/api/restaurant/list", { params });
        const list = res.data?.data || [];
        const withAll = [{ _id: "all", name: "all" }, ...list];
        setRestaurants(withAll);
        const found = withAll.find(r => r._id === selectedRestaurant);
        if (!found) setSelectedRestaurant("all");
    }, [url, selectedRestaurant]);

    const loadCartData = async (token) => {
        const response = await axios.post(url+"/api/cart/get",{},{headers:{token}});
        setCartItems(response.data.cartData);
    }


    useEffect(()=>{
        async function loadData() {
            await fetchCities();
            await fetchRestaurants(selectedCity);
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"));
                const cachedName = localStorage.getItem("userName") || "";
                if (cachedName) setUserName(cachedName);
                await loadCartData(localStorage.getItem("token"));
            }
        }
        loadData();
    },[])

    useEffect(() => {
        fetchRestaurants(selectedCity);
    }, [selectedCity, fetchRestaurants]);

    useEffect(() => {
        fetchFoodList(selectedRestaurant, selectedCity);
    }, [selectedRestaurant, selectedCity, fetchFoodList]);


    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        userName,
        setUserName,
        cities,
        restaurants,
        selectedCity,
        setSelectedCity,
        selectedRestaurant,
        setSelectedRestaurant,
        lang,
        setLang,
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;
