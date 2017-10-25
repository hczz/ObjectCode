# ObjectCode
可以将JavaScript对象（Object）序列化为二进制对象(基于egret引擎，用TypeScript写成)

文件只有一个（ObjectCode.ts），可以向下面这样测试：

			let obj: Object = {
				a: -129,
				c: 890.5,
				d: "sddd",
				f: false,
				o: {
					p: "rty",
					q: true,
					z: {
						sss: 65535,
						ddd: undefined,
						fff: null
					}
				},
				h: [99, 22, 36, 100],
				j: "大家好",
				k: null
			};
      
//编码
let byte: egret.ByteArray = Game.ObjectCode.encode(obj); 
//解码
let dobj: Object = Game.ObjectCode.decode(byte); 
