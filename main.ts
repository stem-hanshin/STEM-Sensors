/**
 * AIMaker STEM Sensors
 */
//% color=190 weight=100 icon="\uf1ec" block="AIMaker: UART Sensors"
//% groups=['High Precision Temperature and Humidity Sensor', '6-Axis Inertial Measurement Unit', 'Air Quality','TVOC','Temperature and Humidity Sensor','Laser Distance Sensor','MLX90614','others']
namespace HANSHIN_STEM_SENSORS {
/**
 * AIMaker STEM Sensors
 */
// color=190 weight=100 icon="\uf1ec" block="AIMaker: UART Sensors"
// groups=['High Precision Temperature and Humidity Sensor', '6-Axis Inertial Measurement Unit', 'Air Quality','TVOC','Temperature and Humidity Sensor','Laser Distance Sensor','MLX90614','others']
    let buffer = ""
    let sensor=0
    let Gyro_x=0
    let Gyro_y=0
    let Gyro_z=0
    let pm25=0
    let pm10=0
    let tvoc=0
    let co2=0
    let temperature=0.0
    let humidity=0.0
    let dht11_humidity = -999.0
    let dht11_temperature = -999.0
    let dht11_readSuccessful = false
    let tof_distance = 0
    
    export enum MODE {
        //% blockId="Active" block="Active"
        Active=0,
        //% blockId="Passive" block="Passive"
        Passive=1
    }

    //% blockId=initSerial block="Init serial port to |TX = %Tx RX=%RX"
    //% Tx.fieldEditor="gridpicker" Tx.fieldOptions.columns=4
    //% Rx.fieldEditor="gridpicker" Rx.fieldOptions.columns=4
    function initSerial(Tx: SerialPin, Rx: SerialPin): void {
        serial.redirect(Tx, Rx, 9600)
        buffer = serial.readString()
        basic.pause(100)
        serial.writeString("CM")
        basic.pause(300)
        serial.readString();
    }

    //% blockId=dHT11Humidity block="Humidity" 
    //% group="High Precision Temperature and Humidity Sensor"
    export function dHT11Humidity(): number {
        return dht11_humidity;
    }
    
    //% blockId=dHT11Temperature block="Temperature" 
    //% group="High Precision Temperature and Humidity Sensor"
    export function dHT11Temperature(): number {
        return dht11_temperature;
    }

    //% block="Read Data pin $dataPin|Wait 2 sec after query $wait"
    //% wait.defl=true
    //% group="High Precision Temperature and Humidity Sensor"
    export function queryDHT11Data(dataPin: DigitalPin, wait: boolean) 
    {
        //initialize
        let startTime: number = 0
        let endTime: number = 0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index2 = 0; index2 < 5; index2++) resultArray.push(0)
        dht11_humidity = -999.0
        dht11_temperature = -999.0
        dht11_readSuccessful = false

        startTime = input.runningTimeMicros()
0
        //request data
        pins.digitalWritePin(dataPin, 0) //begin protocol
        basic.pause(18)
       // pins.setPull(dataPin, PinPullMode.PullUp)
        pins.digitalReadPin(dataPin)
        control.waitMicros(20)
        while (pins.digitalReadPin(dataPin) == 1);
        while (pins.digitalReadPin(dataPin) == 0); //sensor response
        while (pins.digitalReadPin(dataPin) == 1); //sensor response

        //read data (5 bytes)
        for (let index3 = 0; index3 < 40; index3++) {
            while (pins.digitalReadPin(dataPin) == 1);
            while (pins.digitalReadPin(dataPin) == 0);
            control.waitMicros(28)
            //if sensor pull up data pin for more than 28 us it means 1, otherwise 0
            if (pins.digitalReadPin(dataPin) == 1) dataArray[index3] = true
        }

        endTime = input.runningTimeMicros()

        //convert byte number array to integer
        for (let index4 = 0; index4 < 5; index4++)
            for (let index22 = 0; index22 < 8; index22++)
                if (dataArray[8 * index4 + index22]) resultArray[index4] += 2 ** (7 - index22)

        //verify checksum
        checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
        checksum = resultArray[4]
        if (checksumTmp >= 512) checksumTmp -= 512
        if (checksumTmp >= 256) checksumTmp -= 256
        if (checksum == checksumTmp) dht11_readSuccessful = true

        //read data if checksum ok
        if (dht11_readSuccessful) {
            dht11_humidity = resultArray[0] + resultArray[1] / 100
            dht11_temperature = resultArray[2] + resultArray[3] / 100
        }
        //wait 2 sec after query if needed
        if (wait) basic.pause(2000)
    }

    //% blockId=gyroZ block="Gyro Z" 
    //% group="6-Axis Inertial Measurement Unit"
    export function gyroZ() : number {
        return Gyro_z;
    }

    //% blockId=gyroY block="Gyro Y" 
    //% group="6-Axis Inertial Measurement Unit"
    export function gyroY() : number {
        return Gyro_y;
    }

    //% blockId=gyroX block="Gyro X" 
    //% group="6-Axis Inertial Measurement Unit"
    export function gyroX() : number {
        return Gyro_x;
    }
    
    //% blockId=queryGyroData block="Read gyro data" 
    //% group="6-Axis Inertial Measurement Unit"
    export function queryGyroData() : void {
        sensor = 2
        serial.writeString("CM+GYD08U")
    }
    //% blockId=setGyroModel block="Set Gyro Model to |mode=%mode active interval time=%activeInterval second at serial TX=%Tx Rx=%Rx"
    //% mode.fieldEditor="gridpicker" mode.fieldOptions.columns=1
    //% activeInterval.min=1 activeInterval.max=9 activeInterval.defl=5
    //% group="6-Axis Inertial Measurement Unit"
    //% Tx.fieldEditor="gridpicker" Tx.fieldOptions.columns=4
    //% Rx.fieldEditor="gridpicker" Rx.fieldOptions.columns=4
    //% blockExternalInputs=true
    export function setGyroModel(mode: MODE, activeInterval: number,Tx: SerialPin, Rx: SerialPin) : void {
        sensor = 2
        initSerial(Tx,Rx)
        if( mode === MODE.Active ) {
            let modeCmd22= "CM+GYD08U="+activeInterval
            serial.writeString(modeCmd22)
        }
        else {
            serial.writeString("CM+GYD08U")
        }
    }
    
    //% blockId=pM25 block="PM25" 
    //% group="Air Quality"
    export function pM25(): number {
        return pm25;
    }

    //% blockId=pM10 block="PM10" 
    //% group="Air Quality"
    export function pM10(): number {
        return pm10;
    }
    
    //% blockId=queryGyroData block="Read gyro data" 
    //% group="Air Quality"
    export function queryPMT7Data() : void {
        sensor = 3
        serial.writeString("CM+D11U")
    }

    //% blockId=setPM_T7Model block="Set PM_T7 Model to |mode=%mode active interval time=%activeInterval second at serial TX=%Tx Rx=%Rx"
    //% mode.fieldEditor="gridpicker" mode.fieldOptions.columns=1
    //% activeInterval.min=1 activeInterval.max=9 activeInterval.defl=5
    //% group="Air Quality"
    //% Tx.fieldEditor="gridpicker" Tx.fieldOptions.columns=4
    //% Rx.fieldEditor="gridpicker" Rx.fieldOptions.columns=4
    //% blockExternalInputs=true
    export function setPMT7Model(mode: MODE, activeInterval: number,Tx: SerialPin, Rx: SerialPin) : void {
        sensor = 3
        initSerial(Tx,Rx)
        if( mode === MODE.Active ) {
            let modeCmd3= "CM+D11U="+activeInterval
            serial.writeString(modeCmd3)
        }
        else {
            serial.writeString("CM+D11U")
        }
    }

    //% blockId=tVOC block="TVOC" 
    //% group="TVOC"
    export function tVOC(): number {
        return tvoc;
    }

    //% blockId=cO2 block="CO2" 
    //% group="TVOC"
    export function cO2(): number {
        return co2;
    }

    //% blockId=querySGP30Data block="Read SGP30 data" 
    //% group="TVOC"
    export function querySGP30Data() : void {
        sensor = 4
        serial.writeString("CM+D10U")
    }
    //% blockId=setSGP30Model block="Set SGP30 Model to |mode=%mode active interval time=%activeInterval second at serial TX=%Tx Rx=%Rx"
    //% mode.fieldEditor="gridpicker" mode.fieldOptions.columns=1
    //% activeInterval.min=1 activeInterval.max=9 activeInterval.defl=5
    //% group="TVOC"
    //% Tx.fieldEditor="gridpicker" Tx.fieldOptions.columns=4
    //% Rx.fieldEditor="gridpicker" Rx.fieldOptions.columns=4
    //% blockExternalInputs=true
    export function setSGP30Model(mode: MODE, activeInterval: number,Tx: SerialPin, Rx: SerialPin) : void {
        sensor = 4
        initSerial(Tx,Rx)
        if( mode === MODE.Active ) {
            let modeCmd4= "CM+D10U="+activeInterval
            serial.writeString(modeCmd4)
        }
        else {
            serial.writeString("CM+D10U")
        }
    }
    
    //% blockId=temperatureValue block="Get temperature" 
    //% group="Temperature and Humidity Sensor"
    export function temperatureValue(): number {
        return temperature;
    }

    //% blockId=humidityValue block="humidity" 
    //% group="Temperature and Humidity Sensor"
    export function humidityValue(): number {
        return humidity;
    }

    


    //% blockId=querySHTX31Data block="Read SHT31X data" 
    //% group="Temperature and Humidity Sensor"
    export function querySHTX31Data() : void {
        sensor = 5
        serial.writeString("CM+D09U")
    }
   
    //% blockId=setSHT31XModel block="Set SHT31X Model to |mode=%mode active interval time=%activeInterval second at serial TX=%Tx Rx=%Rx"
    //% mode.fieldEditor="gridpicker" mode.fieldOptions.columns=1
    //% activeInterval.min=1 activeInterval.max=9 activeInterval.defl=5
    //% group="Temperature and Humidity Sensor"
    //% Tx.fieldEditor="gridpicker" Tx.fieldOptions.columns=4
    //% Rx.fieldEditor="gridpicker" Rx.fieldOptions.columns=4
    //% blockExternalInputs=true
    export function setSHTX31Model(mode: MODE, activeInterval: number,Tx: SerialPin, Rx: SerialPin) : void {
        sensor = 5
        initSerial(Tx,Rx)
        if( mode === MODE.Active ) {
            let modeCmd5= "CM+D09U="+activeInterval
            serial.writeString(modeCmd5)
        }
        else {
            serial.writeString("CM+D09U")
        }
    }

    //% blockId=tofDistanceValue block="TOF Distance" 
    //% group="Laser Distance Sensor"
    export function tofDistanceValue(): number {
        return tof_distance;
    }    
    //% blockId=queryTOFData block="Read TOF data(mm)" 
    //% group="Laser Distance Sensor"
    export function queryTOFData(): void {
        sensor = 6
        serial.writeString("CM+D12U")
    }

    //% blockId=setTOFMode block="Set TOF Model to |mode=%mode active interval time=%activeInterval second at serial TX=%Tx Rx=%Rx"
    //% mode.fieldEditor="gridpicker" mode.fieldOptions.columns=1
    //% activeInterval.min=1 activeInterval.max=9 activeInterval.defl=5
    //% Tx.fieldEditor="gridpicker" Tx.fieldOptions.columns=4
    //% Rx.fieldEditor="gridpicker" Rx.fieldOptions.columns=4
    //% group="Laser Distance Sensor"
    //% blockExternalInputs=true
    export function setTOFMode(mode: MODE, activeInterval: number,Tx: SerialPin, Rx: SerialPin) : void {
        sensor = 6
        initSerial(Tx,Rx)
        if( mode === MODE.Active ) {
            let modeCmd= "CM+D12U="+activeInterval
            serial.writeString(modeCmd)
        }
        else {
            serial.writeString("CM+D12U")
        }
    }

    let mlxTempture = 0
    //% blockId=mlx90614Temperature block="Temperature" 
    //% group="MLX90614"
    export function mlx90614Temperature(): number {
        return mlxTempture;
    }

    //% blockId=queryMLX90614Data block="Read MLX90614 temperature" 
    //% group="MLX90614"
    export function queryMLX90614Data(): void {
        sensor = 7
        serial.writeString("CM+D05U")
    }

    //% blockId=setMLX90614Mode block="Set MLX90614 Model to |mode=%mode active interval time=%activeInterval second at serial TX=%Tx Rx=%Rx"
    //% mode.fieldEditor="gridpicker" mode.fieldOptions.columns=1
    //% activeInterval.min=1 activeInterval.max=9 activeInterval.defl=5
    //% Tx.fieldEditor="gridpicker" Tx.fieldOptions.columns=4
    //% Rx.fieldEditor="gridpicker" Rx.fieldOptions.columns=4
    //% group="MLX90614"
    //% blockExternalInputs=true
    export function setMLX90614Mode(mode: MODE, activeInterval: number,Tx: SerialPin, Rx: SerialPin) : void {
        sensor = 7
        initSerial(Tx,Rx)
        if( mode === MODE.Active ) {
            let modeCmd= "CM+D05U="+activeInterval
            serial.writeString(modeCmd)
        }
        else {
            serial.writeString("CM+D05U")
        }
    }


    let line = ""
    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        line = serial.readLine()  
        let h0 = line.substr(0,1)
        if( h0 == "A" )
        {
            sensor=1
        } else if( h0 == "B" )
        {
            sensor=2
        } else if( h0== "C" )
        {
            sensor=3
        }else if( h0== "D" )
        {
            sensor=4
        }else if( h0== "E" )
        {
            sensor=5
        }else if( h0== "F" )
        {
            sensor=7
        }else if( h0== "G" )
        {
            sensor=6
        }
        
        switch( sensor ) {
            default:
                break;
            case 1: // MPU6050
            {
            }
                break;
            case 2: // Gyro
            {
                Gyro_x= parseInt(line.substr(1,5))
                if( line.substr(0,1) === "-")
                    Gyro_x *= -1
                Gyro_y= parseInt(line.substr(7,5))
                if( line.substr(6,1) === "-")
                    Gyro_y *= -1
                Gyro_z= parseInt(line.substr(13,5))
                if( line.substr(12,1) === "-")
                    Gyro_z *= -1
            }
                break;
            case 3: // PM_T7
            {
                pm25 = parseInt(line.substr(0,4))
                pm10 = parseInt(line.substr(-4,4))
            }
                break;
            case 4: // SGP30 
            {
                tvoc = parseInt(line.substr(0,5))
                co2 = parseInt(line.substr(-5,5))
            }
                break;
            case 5: // SHT31 
            {
                temperature = parseFloat(line.substr(1,5))
                if(line.substr(0,1) === "-" )
                    temperature *= -1
                humidity = parseFloat(line.substr(-5,5))

                //basic.showNumber(temperature)
            }
                break;
            case 6: // TOF
            {
                tof_distance = parseInt(line)
            }
            break;
            case 7: //MLX90614
            {
                mlxTempture = parseFloat(line.substr(1,5))
                if(line.substr(0,1) === "-" )
                    mlxTempture *= -1
            }
            break;
        }
    })
}
