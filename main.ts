/*****************************************************************************
* | File      	:   1in8LCD.ts
* | Author      :   hnwangkg-ezio for Waveshare
* | Function    :   Contorl 1.8inch lcd Show
* | Info        :
*----------------
* | This version:   V2.0
* | Date        :   2021-01-28
* | Info        :   for micro:bit v2
*
******************************************************************************/
//% weight=20 color=#436EEE icon="\uf108"
namespace LCD7735 {
    let LCD_WIDTH = 160  //LCD width
    let LCD_HEIGHT = 128 //LCD height
    //% blockId=LCD_Init
    //% blockGap=8
    //% block="LCD1IN8 Init"
    //% weight=200
    export function LCD_Init(): void {
        pins.digitalWritePin(DigitalPin.P8, 1);
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
    //% block="LCD Clear"
    //% weight=195
    export function LCD_Clear(): void{
        LCD_SetWin(0, 0, LCD_WIDTH-1, LCD_HEIGHT-1);
        LCD_Filling(0);
    }

    //% blockId=LCD_Filling
    //% blockGap=8
    //% block="Filling Color %Color"
    //% color.shadow="colorNumberPicker"
    //% weight=195
    export function LCD_Filling(Color: number): void{
        LCD_SetWin(0, 0, LCD_WIDTH-1, LCD_HEIGHT-1);
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

	//% blockId=LCD_SetBL
    //% blockGap=8
    //% block="Set back light level %Lev"
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
    //% block="Show Screen %flag"
    //% weight=190
    export function LCD_Display(flag : boolean): void {
        //Turn on the LCD display
        LCD_Cmd(flag ? [0x29] : [0x28]);
    }

    //% blockId=DisString
    //% blockGap=8
    //% block="Show String|X %Xchar|Y %Ychar|char %ch|Color %Color"
    //% Xchar.min=1 Xchar.max=160 Ychar.min=1 Ychar.max=128
    //% Color.min=0 Color.max=65535
    //% weight=100
    export function DisString(Xchar: number, Ychar: number, ch: string, Color: number): void{
		let Xpoint = Xchar;
		let Ypoint = Ychar;
        let Font_Height = 12;
        let Font_Width = 7;
		let ch_len = ch.length;
		let i = 0;
		for(i = 0; i < ch_len; i++){
			let ch_asicc =  ch.charCodeAt(i) - 32;//NULL = 32
			let Char_Offset = ch_asicc * 12;

			if((Xpoint + Font_Width) > 160) {
				Xpoint = Xchar;
				Ypoint += Font_Height;
			}

			// If the Y direction is full, reposition to(Xstart, Ystart)
			if((Ypoint  + Font_Height) > 128) {
				Xpoint = Xchar;
				Ypoint = Ychar;
			}
			DisChar_1207(Xpoint, Ypoint, Char_Offset, Color);

			//The next word of the abscissa increases the font of the broadband
			Xpoint += Font_Width;
		}
    }

    //% blockId=DisNumber
    //% blockGap=8
    //% block="Show number|X %Xnum|Y %Ynum|number %num|Color %Color"
    //% Xnum.min=1 Xnum.max=160 Ynum.min=1 Ynum.max=128
    //% Color.min=0 Color.max=65535
    //% weight=100
    export function DisNumber(Xnum: number, Ynum: number, num: number, Color: number): void{
		let Xpoint = Xnum;
		let Ypoint = Ynum;
        DisString(Xnum, Ynum, num + "", Color);
    }

    function DisChar_1207(Xchar:number, Ychar:number, Char_Offset:number, Color:number): void {

    }
    function Swop_AB(Point1: number, Point2: number): void {
        let Temp = 0;
        Temp = Point1;
        Point1 = Point2;
        Point2 = Temp;
    }
}
