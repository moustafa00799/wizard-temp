[out:json][timeout:90];
(
  nwr[amenity~"^(school|college|university|kindergarten|clinic|hospital)$"](29.95,31.15,30.15,31.45);
  nwr[amenity~"^(school|college|university|kindergarten|clinic|hospital)$"](24.55,46.50,24.90,46.90);
);
out center tags;
