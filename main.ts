//% weight=20 color=#436EEE icon="\uf108"
namespace LCD7735 {
    let LCD_WIDTH = 160  //LCD width
    let LCD_HEIGHT = 128 //LCD height
    //% blockId=LCD_Init
    //% blockGap=8
    //% block="LCD初始化"
    //% weight=200
    export function LCD_Init(): void {
        pins.digitalWritePin(DigitalPin.P8, 1);
        pins.digitalWritePin(DigitalPin.P2, 1);
        pins.digitalWritePin(DigitalPin.P12, 1);
        pins.digitalWritePin(DigitalPin.P16, 1);

        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13);
        pins.spiFormat(8, 0);
        pins.spiFrequency(18000000);
        control.waitMicros(1000);
        pins.digitalWritePin(DigitalPin.P8, 0);
        control.waitMicros(1000);
        pins.digitalWritePin(DigitalPin.P8, 1);


        LCD_Cmd([0xb4, 0x07]);
        LCD_Cmd([0xf0, 0x01]);
        LCD_Cmd([0xf6, 0x00]);
        LCD_Cmd([0x3a, 0x05]);
        LCD_Cmd([0x36, 0xa0]);
        LCD_Cmd([0x11]);
        LCD_Cmd([0x29]);
    }

    function LCD_Cmd(dat: number[]): void {
        pins.digitalWritePin(DigitalPin.P12, 0);
        pins.digitalWritePin(DigitalPin.P16, 0);
        pins.spiWrite(dat[0]);
        dat.forEach((value: number, index: number) => {
            if (index > 0) {
                pins.digitalWritePin(DigitalPin.P12, 1);
            }
            pins.spiWrite(value);            
        });
        pins.digitalWritePin(DigitalPin.P16, 1);
    }

    function LCD_RGB2num(dat: number): number[] {
        let R = (dat >> 16) & 0xff;
        let G = (dat >> 8) & 0xff;
        let B = dat & 0xff;

        let tmp1:number = R & 0xf8;
        tmp1 |= (G >> 3) & 0x7;
        let tmp2:number = (G << 5) & 0xe0;
        tmp2 = (B >> 3) & 0x1f;
        return([tmp1,tmp2])
    }

    //% blockId=LCD_Clear
    //% blockGap=8
    //% block="LCD清屏"
    //% weight=195
    export function LCD_Clear(): void{
        LCD_SetWin(0, LCD_WIDTH - 1, 0, LCD_HEIGHT-1);
        LCD_Filling(0);
    }

    //% blockId=LCD_Filling
    //% blockGap=8
    //% block="用%Color填充屏幕"
    //% Color.shadow="colorNumberPicker"
    //% weight=195
    export function LCD_Filling(Color: number): void{
        LCD_SetWin(0, LCD_WIDTH - 1, 0, LCD_HEIGHT-1);
        LCD_Cmd([0x2c]);
        let cl = LCD_RGB2num(Color);
        pins.digitalWritePin(DigitalPin.P12, 1);
        pins.digitalWritePin(DigitalPin.P16, 0);
        for (let i = 0; i < LCD_WIDTH * LCD_HEIGHT; i++) {
            pins.spiWrite(cl[0]);
            pins.spiWrite(cl[1]);
        }
        pins.digitalWritePin(DigitalPin.P16, 1);
    }

    function LCD_SetDat(buf:Buffer, Color: number, BColor: number): void {
        LCD_Cmd([0x2c]);
        let cl = LCD_RGB2num(Color);
        let bc = LCD_RGB2num(BColor);
        pins.digitalWritePin(DigitalPin.P12, 1);
        pins.digitalWritePin(DigitalPin.P16, 0);
        for (let i = 0; i < buf.length; i++) {
            let ch = buf[i];
            for(let j=0;j<8;j++) {
                if(ch & 0x80) {
                    pins.spiWrite(cl[0]);
                    pins.spiWrite(cl[1]);
                }
                else {
                    pins.spiWrite(bc[0]);
                    pins.spiWrite(bc[1]);
                }
                ch = ch << 1;
            }
        }
        pins.digitalWritePin(DigitalPin.P16, 1);
    }

	//% blockId=LCD_SetBL
    //% blockGap=8
    //% block="设置背光亮度(0-1023) %Lev"
	//% Lev.min=0 Lev.max=1023
    //% weight=180
    export function LCD_SetBL(Lev: number): void{
        pins.analogWritePin(AnalogPin.P1, 1023-Lev)
    }

    function LCD_SetWin(Xstart: number, Xend: number, Ystart: number, Yend: number): void {
        //set the X coordinates
        LCD_Cmd([0x2A, 0x00, Xstart+1, 0x00, Xend+1]);
        //set the Y coordinates
        LCD_Cmd([0x2B, 0x00, Ystart+2, 0x00, Yend+2]);
    }

    //% blockId=LCD_Display
    //% blockGap=8
    //% block="屏幕打开显示%flag"
    //% weight=190
    export function LCD_Display(flag : boolean): void {
        //Turn on the LCD display
        LCD_Cmd(flag ? [0x29] : [0x28]);
    }

    //% blockId=DisString
    //% blockGap=8
    //% block="显示字符串X %Xchar Y %Ychar char %ch|颜色 %Color 背景 %BColor"
    //% Xchar.min=0 Xchar.max=159 Ychar.min=0 Ychar.max=127
    //% Color.shadow="colorNumberPicker"
    //% BColor.shadow="colorNumberPicker"
    //% weight=100
    export function DisString(Xchar: number, Ychar: number, ch: String, Color: number, BColor: number): void{
        let len = ch.length;

        for (let num=0;num<ch.length;num ++) {
            let dot = GB_GetDat(ch.charCodeAt(num));
            if (dot.length > 16) {//gb2312
                LCD_SetWin(Xchar, Xchar + 15, Ychar, Ychar + 15);
                LCD_SetDat(dot, Color, BColor);
                Xchar += 16;
            }
            else {
                LCD_SetWin(Xchar, Xchar + 7, Ychar, Ychar+15);
                LCD_SetDat(dot, Color, BColor);
                Xchar += 8;
            }
        }
    }

    function GB_GetDat(ch:number) : Buffer {
        let addr = ch << 5;
        pins.digitalWritePin(DigitalPin.P2, 0);
        pins.spiWrite(0x03);
        pins.spiWrite(addr >> 16);
        pins.spiWrite((addr >> 8) & 0xff);
        pins.spiWrite(addr & 0xff);
        let res = pins.createBuffer(32);
        let half = 1;
        for (let i = 0; i < 32; i++) {
            res[i] = pins.spiWrite(0x0);
            if(res[i] != 0xff && i < 16) {
                half = 0;
            }
        }
        pins.digitalWritePin(DigitalPin.P2, 1);
        if (half) return (res.slice(16,16));
        else return(res);
    }
}
