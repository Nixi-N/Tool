/*
FQNovel Deep Clean Script
适用于 Surge
*/

function removeAds(obj) {

if (!obj) return obj;

if (Array.isArray(obj)) {

return obj
.map(removeAds)
.filter(item => {

if (!item) return false;

let str = JSON.stringify(item).toLowerCase();

if (
str.includes("ad") ||
str.includes("advert") ||
str.includes("banner") ||
str.includes("promotion") ||
str.includes("pangolin") ||
str.includes("commercial")
) {
return false;
}

return true;

});

}

if (typeof obj === "object") {

for (let key in obj) {

let lowerKey = key.toLowerCase();

if (
lowerKey.includes("ad") ||
lowerKey.includes("advert") ||
lowerKey.includes("banner") ||
lowerKey.includes("promotion")
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

let body = $response.body;

let json = JSON.parse(body);

json = removeAds(json);

body = JSON.stringify(json);

$done({ body });

} catch (e) {

$done({});

}