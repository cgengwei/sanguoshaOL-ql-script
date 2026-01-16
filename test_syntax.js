// 简单的语法测试脚本
const fs = require('fs');
const path = require('path');

// 测试基本语法
console.log('测试基本语法...');

// 测试异步函数
async function testAsync() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('异步函数测试成功');
    }, 1000);
  });
}

// 测试箭头函数
const testArrow = () => {
  console.log('箭头函数测试成功');
};

// 测试模板字符串
const name = '测试';
console.log(`模板字符串测试成功: ${name}`);

// 测试解构赋值
const obj = { a: 1, b: 2 };
const { a, b } = obj;
console.log(`解构赋值测试成功: a=${a}, b=${b}`);

// 测试for...of循环
const arr = [1, 2, 3];
for (const item of arr) {
  console.log(`for...of循环测试: ${item}`);
}

// 测试async/await
testAsync().then(result => {
  console.log(result);
  console.log('所有语法测试完成！');
});
