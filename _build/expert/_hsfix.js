const fs=require('fs'),path=require('path');
const W='_build/expert/work',B='_build/expert/batches';
// [postid, find, replace]  -- find must be unique-ish; applied to batch value
const R=[
// p10_238 واکنش نشان -> second
['hs_p10_238','شاید این یک DP باشد که قیمت در آن واکنش نشان می‌دهد.','XX'],
];
