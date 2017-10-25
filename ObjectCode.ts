module Game {

	export class ObjectCode {
		
		public static encode(obj: Object): egret.ByteArray {
			let head: ObjectType[] = [];
			let databyte: egret.ByteArray = new egret.ByteArray();
			let keysbyte: egret.ByteArray = new egret.ByteArray();
			this.encodeobj(obj, head, keysbyte, databyte);
			let headbyte: egret.ByteArray = new egret.ByteArray();

			for (let i: number = 0, len: number = head.length, tn: number; i < len; i += 2) {
				tn = 0;
				tn = head[i];
				if (i + 1 < len) {
					tn = (tn << 4) | head[i + 1];
				}
				else {
					tn = (tn << 4) | ObjectType.empty;
				}
				headbyte.writeByte(tn);
			}

			let endbyte: egret.ByteArray = new egret.ByteArray();
			endbyte.writeByte(1);//版本
			endbyte.writeUnsignedInt(headbyte.length);
			endbyte.writeUnsignedInt(keysbyte.length);
			endbyte.writeUnsignedInt(databyte.length);
			endbyte.writeBytes(headbyte);
			endbyte.writeBytes(keysbyte);
			endbyte.writeBytes(databyte);
			endbyte.position = 0;
			return endbyte;
		}
		public static decode(byte: egret.ByteArray): Object {
			let headbyte: egret.ByteArray = new egret.ByteArray();
			let keysbyte: egret.ByteArray = new egret.ByteArray();
			let databyte: egret.ByteArray = new egret.ByteArray();

			byte.position = 0;
			let version: number = byte.readByte();
			let headLen: number = byte.readUnsignedInt();
			let keysLen: number = byte.readUnsignedInt();
			let dataLen: number = byte.readUnsignedInt();

			byte.readBytes(headbyte, 0, headLen);
			byte.readBytes(keysbyte, 0, keysLen);
			byte.readBytes(databyte, 0, dataLen);

			let dobj: Object = {};
			let head: ObjectType[] = [];
			let tn: number;

			while (headbyte.bytesAvailable) {
				tn = 0;
				tn = headbyte.readByte();
				head.push((tn >> 4) & 0xF, tn & 0xF);
			}

			databyte.position = 0;
			keysbyte.position = 0;
			this.decodeobj(dobj, head, keysbyte, databyte);

			return dobj;
		}

		private static decodeobj(obj: Object, head: ObjectType[], keys: egret.ByteArray, data: egret.ByteArray): void {
			for (let i: number = 0, len: number = head.length, type: ObjectType, keyIndex = 0, oldobj: Object[] = []; i < len; ++i) {
				type = head[i];
				switch (type) {
					case ObjectType.boolean:
						obj[keys.readUTF()] = data.readBoolean();
						break
					case ObjectType.byte:
						obj[keys.readUTF()] = data.readByte();
						break
					case ObjectType.short:
						obj[keys.readUTF()] = data.readShort();
						break
					case ObjectType.int:
						obj[keys.readUTF()] = data.readInt();
						break
					case ObjectType.uint:
						obj[keys.readUTF()] = data.readUnsignedInt();
						break
					case ObjectType.float:
						obj[keys.readUTF()] = data.readFloat();
						break
					case ObjectType.number:
						obj[keys.readUTF()] = data.readDouble();
						break
					case ObjectType.string:
						obj[keys.readUTF()] = data.readUTF();
						break
					case ObjectType.object:
						let newobj: Object = {};
						obj[keys.readUTF()] = newobj;
						oldobj.push(obj);
						obj = newobj;
						break
					case ObjectType.array:
						let newarr: any[] = [];
						obj[keys.readUTF()] = newarr;
						oldobj.push(obj);
						obj = newarr;
						break
					case ObjectType.ushot:
						obj[keys.readUTF()] = data.readUnsignedShort();
						break;
					case ObjectType.undefined:
						obj[keys.readUTF()] = undefined;
						break
					case ObjectType.null:
						obj[keys.readUTF()] = null;
						break
					case ObjectType.empty:
						if (oldobj.length) {
							obj = oldobj.pop();
						}
						break;
				}
			}
		}

		private static encodeobj(obj: Object, head: ObjectType[], keys: egret.ByteArray, byte: egret.ByteArray): void {
			forend:
			for (let key in obj) {
				switch (typeof obj[key]) {
					case ObjectType[0]://boolean
						head.push(ObjectType.boolean);
						keys.writeUTF(key);
						byte.writeBoolean(obj[key]);
						break
					case ObjectType[6]://number
						keys.writeUTF(key);
						//byte   obj[key] % 1 === 0 判断是整数
						if (obj[key] % 1 === 0 && obj[key] >= -128 && obj[key] <= 127) {
							head.push(ObjectType.byte);
							byte.writeByte(obj[key]);
						}
						//short
						else if (obj[key] % 1 === 0 && obj[key] >= -32768 && obj[key] <= 32767) {
							head.push(ObjectType.short);
							byte.writeShort(obj[key]);
						}
						//ushot
						else if (obj[key] % 1 === 0 && obj[key] >= 0 && obj[key] <= 65535) {
							head.push(ObjectType.ushot);
							byte.writeUnsignedShort(obj[key]);
						}
						//int
						else if (obj[key] % 1 === 0 && obj[key] >= -2147483648 && obj[key] <= 2147483647) {
							head.push(ObjectType.int);
							byte.writeInt(obj[key]);
						}
						//uint
						else if (obj[key] % 1 === 0 && obj[key] >= 0 && obj[key] <= 4294967295) {
							head.push(ObjectType.uint);
							byte.writeUnsignedInt(obj[key]);
						}
						//float
						else if (obj[key] >= -3.4E38 && obj[key] <= 3.4E38) {
							head.push(ObjectType.float);
							byte.writeFloat(obj[key]);
						}
						else {
							head.push(ObjectType.number);
							byte.writeDouble(obj[key]);
						}
						break
					case ObjectType[7]://string
						head.push(ObjectType.string);
						keys.writeUTF(key);
						byte.writeUTF(obj[key]);
						break
					case ObjectType[8]://object
						if (obj[key] === null) {
							head.push(ObjectType.null);
							keys.writeUTF(key);
						}
						else if (Array.isArray(obj[key])) {
							head.push(ObjectType.array);
							keys.writeUTF(key);
							let cobj: Object = obj[key];
							this.encodeobj(cobj, head, keys, byte);
						}
						else {
							head.push(ObjectType.object);
							keys.writeUTF(key);
							let cobj: Object = obj[key];
							this.encodeobj(cobj, head, keys, byte);
						}
						break
					case ObjectType[14]://undefined
						head.push(ObjectType.undefined);
						keys.writeUTF(key);
						//byte.writeByte(0);
						break
					case ObjectType[15]://empty
						break forend;
				}
				//egret.log(key, obj[key], typeof obj[key] == 'object', Array.isArray(obj[key]))
			}
			head.push(ObjectType.empty);
		}
	}

	enum ObjectType {
		boolean = 0,
		byte = 1,
		short = 2,
		int = 3,
		uint = 4,
		float = 5,
		number = 6,
		string = 7,
		object = 8,
		array = 9,
		ushot = 10,

		null = 13,
		undefined = 14,
		empty = 15
	}
}