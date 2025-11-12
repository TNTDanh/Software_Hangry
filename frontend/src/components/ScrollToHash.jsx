import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export default function ScrollToHash({ offset = 80 }) {
const location = useLocation();
useEffect(() => {
const { hash } = location;
if (!hash) return;
const id = hash.slice(1);
const el = document.getElementById(id);
if (!el) return;
requestAnimationFrame(() => {
const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
window.scrollTo({ top: y, behavior: 'smooth' });
});
}, [location]);
return null;
}