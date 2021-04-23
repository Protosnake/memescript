// function primeString (s) {
//   var length = s.length;
//   // if str length is uneven it is by definition cannot be created via two equal strings
//   if (length == 1 || length % 2) return true;
//   var mid = Math.floor(length/2);
//   return !(s.slice(0,mid) == s.slice(mid));
// }

// var ex1 = 'a';
// var ex2 = 'abcd';
// var ex3 = 'aa';
// var ex4 = 'xyxyxy';
// var ex5 = 'abac';
// var ex6 = 'abcabcabcabc';
// var ex7 = 'utdutdtdutd';

// // console.log(primeString(ex1), '1');
// // console.log(primeString(ex2), '2');
// // console.log(primeString(ex3), '3');
// console.log(primeString(ex4), '4');
// // console.log(primeString(ex5), '5');
// // console.log(primeString(ex6), '6');
// // console.log(primeString(ex7), '7');

function validBraces(braces){
  var openingBracers = '[{(';
  var closingBracers = ']})';
  var stack = [];
  
  if(braces.length % 2) return false;

  for(var i = 0; i < braces.length; i++) {
    if(openingBracers.includes(braces[i])) {
      stack.push(braces[i]);
    } else {
      
    }
  }
}

console.log(validBraces("(){}[]"))
console.log(validBraces("(}"))