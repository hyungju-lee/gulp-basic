var evens = [2, 4, 6, 8,];

// Expression bodies (표현식의 결과가 반환됨)
// var odds = evens.map(v => v + 1);   // [3, 5, 7, 9]
var nums = evens.map((v, i) => v + i);  // [2, 5, 8, 11]
var pairs = evens.map(v => ({even: v, odd: v + 1})); // [{even: 2, odd: 3}, ...]

// Statement bodies (블럭 내부를 실행만 함, 반환을 위해선 return을 명시)
// nums.forEach(v => {
//     if (v % 5 === 0)
//         fives.push(v);
// });

// Lexical this
// 출력결과 : Bob knows John, Brian
var bob = {
    _name: "Bob",
    _friends: ["John, Brian"],
    printFriends() {
        this._friends.forEach(f =>
            console.log(this._name + " knows " + f));
    }
}