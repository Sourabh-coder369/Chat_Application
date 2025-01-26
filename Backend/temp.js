let arr = [4, 9, 0, 5, 2, 1];
let arr1 = [5, 2, 1];

let arr2 = arr.sort((a, b) => {
  const aInArr1 = arr1.includes(a); // Check if `a` is in `arr1`
  const bInArr1 = arr1.includes(b); // Check if `b` is in `arr1`

  if (aInArr1 && bInArr1) {
    // If both `a` and `b` are in `arr1`, maintain their relative order
    return arr1.indexOf(a) - arr1.indexOf(b);
  } else if (aInArr1) {
    // If only `a` is in `arr1`, it should come before `b`
    return -1;
  } else if (bInArr1) {
    // If only `b` is in `arr1`, it should come before `a`
    return 1;
  } else {
    // If neither `a` nor `b` is in `arr1`, sort normally
    return a - b;
  }
});

console.log("1" in arr)