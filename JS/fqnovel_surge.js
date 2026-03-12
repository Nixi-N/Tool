let body = $response.body;

function removeAds(obj) {

if (!obj) return obj;

if (Array.isArray(obj)) {
return obj.map(removeAds).filter(i => {
if (!i) return false;

let str = JSON.stringify(i);

if (
str.includes("ad") ||
str.includes("advert") ||
str.includes("banner") ||
str.includes("promotion") ||
str.includes("commercial") ||
str.includes("pangolin")
) {
return false;
}

return true;
});
}

if (typeof obj === "object") {

for (let key in obj) {

if (
key.toLowerCase().includes("ad") ||
key.toLowerCase().includes("advert") ||
key.toLowerCase().includes("banner") ||
key.toLowerCase().includes("promotion")
) {
delete obj[key];
continue;
}

obj[key] = removeAds(obj[key]);

}

}

return obj;

}

try {

let json = JSON.parse(body);

json = removeAds(json);

body = JSON.stringify(json);

} catch (e) {}

$done({ body });