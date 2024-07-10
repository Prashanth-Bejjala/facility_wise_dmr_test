import mysql2 from 'mysql2/promise'

const dbConnection = mysql2.createPool({
  host: "43.204.113.12",
  user: "vw-srv-0001",
  password: "Apple#123",
  port: 6603,
  database: "amazon_quicksight",
});
console.log("Hello")

export const lambdaHandler = async (event, context) => {

  try{  
    const reports=JSON.parse(event.body).results;

     
    for (const report of reports) {
      const { id, date,jsondata } = report;

      // const date1 = new Date();
      // date1.setHours(date1.getHours() + 5);
      // date1.setMinutes(date1.getMinutes() + 30);
  
      // const updatedTimeString = date1.toISOString();
      // let date = updatedTimeString.slice(0, -4);
  
      // date = date.replace("T", " ");
      // console.log(date.slice(0,date.length-1))

      const {facilityId}=jsondata
        console.log(facilityId)
    
      console.log("id", id);

  


      // // Manpower data insertion
      const { techTeam, horticulture, houseKeeping, security, pwdCctvOp } =
        jsondata;
      const teamsArray = [
        {
          id,
          teamName: "techTeam",
          manPowerActual: techTeam,
          date: date.slice(0, -1),

        },
        {
          id,
          teamName: "horticulture",
          manPowerActual: horticulture,
          date: date.slice(0, -1),
       
        },
        {
          id,
          teamName: "houseKeeping",
          manPowerActual: houseKeeping,
          date: date.slice(0, -1),
        
        },
        {
          id,
          teamName: "security",
          manPowerActual: security,
          date: date.slice(0, -1),
          
        },
        {
          id,
          teamName: "cctvOp",
          manPowerActual: pwdCctvOp,
          date: date.slice(0, -1),
    
        },
      ];

      console.log(facilityId)
      const manPowerQuery = `INSERT INTO humanResourcesTest (id, teamName, manPowerActual, date,
        facilityId) VALUES (?, ?, ?, ?,?)`;
      await Promise.all(
        teamsArray.map((data) =>
          dbConnection.execute(manPowerQuery, [
            data.id,
            data.teamName,
            data.manPowerActual,
            data.date,
          facilityId
          ])
        )
      );

      // // Electricity usage data insertion

      const {
        substationMeterE1,
        substationMeterCommonArea,
        substationMeterD1,
        substationMeterC2,
        substationMeterC1,
        substationMeterAB1,
        substationMeterAB2,
        solarMeterCommonArea,
        solarMeterABMyntra,
        HTmeter,
      } = jsondata;
      const usageByMeters = [
        {
          id,
          meterName: "substationMeterE1",
          kvah: substationMeterE1.kvah,
          kwh: substationMeterE1.kwh,
          isSubstationMeter: true,

          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "substationMeterC1",
          kvah: substationMeterC1.kvah,
          kwh: substationMeterC1.kwh,
          isSubstationMeter: true,

          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "substationMeterC2",
          kvah: substationMeterC2.kvah,
          kwh: substationMeterC2.kwh,
          isSubstationMeter: true,
          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "substationMeterD1",
          kvah: substationMeterD1.kvah,
          kwh: substationMeterD1.kwh,
          isSubstationMeter: true,

          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "substationMeterCommonArea",
          kvah: substationMeterCommonArea.kvah,
          kwh: substationMeterCommonArea.kwh,
          isSubstationMeter: true,
          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "substationMeterAB1",
          kvah: substationMeterAB1.kvah,
          kwh: substationMeterAB1.kwh,
          isSubstationMeter: true,
          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "substationMeterAB2",
          kvah: substationMeterAB2.kvah,
          kwh: substationMeterAB2.kwh,
          isSubstationMeter: true,
          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "solarMeterCommonArea",
          kvah: solarMeterCommonArea.kvah,
          kwh: solarMeterCommonArea.kwh,
          isSubstationMeter: false,
          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "solarMeterABMyntra",
          kvah: solarMeterABMyntra.kvah,
          kwh: solarMeterABMyntra.kwh,
          isSubstationMeter: false,
          date: date.slice(0, -1),
        },
        {
          id,
          meterName: "HTmeter",
          kvah: HTmeter.kvah,
          kwh: HTmeter.kwh,
          isSubstationMeter: false,
          date: date.slice(0, -1),
        },
      ];
      // console.log(usageByMeters);

      // // // Fetch previous day's data for a given meter
      async function fetchPreviousDayData(meterName, currentDate) {
        const previousDayValuesQuery = `
          SELECT presentKvah, presentKwh
          FROM electricityUsage
          WHERE meterName = ? AND date < ?
          ORDER BY date DESC
          LIMIT 1
          `;
        const [previousDayValuesRows] = await dbConnection.execute(
          previousDayValuesQuery,
          [meterName, currentDate]
        );
        const previousDayValues =    previousDayValuesRows[0] || {
       
          presentKvah: 0,
          presentKwh: 0,
        };
        return previousDayValues;
      }

      await Promise.all(
        usageByMeters.map(async (meterData) => {
          const previousDayValues = await fetchPreviousDayData(
            meterData.meterName,
            meterData.date
          );
          const consumptionKwh = meterData.kwh - previousDayValues.presentKwh;
          const consumptionKvah =
            meterData.kvah - previousDayValues.presentKvah;
          const pf = meterData.isSubstationMeter
            ? parseFloat(consumptionKwh / consumptionKvah).toFixed(2) // Calculate and round pf to 2 decimal places
            : null;
          // console.log(pf);

          const electricityUsageQuery = `
            INSERT INTO electricityUsageTest (id, meterName, presentKvah, presentKwh, previousKvah, previousKwh, date,pf,facilityId)
            VALUES (?, ?, ?, ?, ?, ?, ?,?,?)
          `;
          await dbConnection.execute(electricityUsageQuery, [
            meterData.id,
            meterData.meterName,
            meterData.kvah,
            meterData.kwh,
            previousDayValues.presentKvah,
            previousDayValues.presentKwh,
            meterData.date,
            pf,
            facilityId
          ]);
        })
      );

      // //   // // Water Usage Processing

      async function fetchPreviousDayFinalReading(tankType, currentDate) {
        const previousDayFinalReadingQuery = `
          SELECT finalReading
          FROM waterUsage
          WHERE tankType = ? AND date < ?
          ORDER BY date DESC
          LIMIT 1   `;

        const [previousDayFinalReadingRows] = await dbConnection.execute(
          previousDayFinalReadingQuery,
          [tankType, currentDate]
        );
        return previousDayFinalReadingRows[0]? previousDayFinalReadingRows[0].finalReading : 0;
      }

      const { genericTank, borewell, ansal, stpWatertank } = jsondata;
      const waterConsumptionByTankType = [
        {
          id,
          tankType: "genericTank",
          hardnessOfWater: genericTank.hardnessOfWater,
          finalReading: genericTank.meterReading,
          date: date.slice(0, -1),
        },
        {
          id,
          tankType: "borewell",
          hardnessOfWater: borewell.hardnessOfWater,
          finalReading: borewell.meterReading,
          date: date.slice(0, -1),
        },
        {
          id,
          tankType: "ansal",
          hardnessOfWater: ansal.hardnessOfWater,
          finalReading: ansal.meterReading,
          date: date.slice(0, -1),
        },
        {
          id,
          tankType: "stpWatertank",
          hardnessOfWater: stpWatertank.hardnessOfWater,
          finalReading: stpWatertank.meterReading,
          date: date.slice(0, -1),
        },
      ];

      await Promise.all(
        waterConsumptionByTankType.map(async (tankData) => {
          const previousDayFinalReading = await fetchPreviousDayFinalReading(
            tankData.tankType,
            tankData.date
          );
          const waterUsageQuery = `
            INSERT INTO waterUsageTest (id, tankType, hardnessOfWater, initialReading, finalReading, date,facilityId)
            VALUES (?, ?, ?, ?, ?, ?,?)
          `;
          await dbConnection.execute(waterUsageQuery, [
            tankData.id,
            tankData.tankType,
            tankData.hardnessOfWater,
            previousDayFinalReading,
            tankData.finalReading,
            tankData.date,
            facilityId
          ]);
        })
      );
      // //   //   //Diesel Usage

      // //   //   // HSD STOCK
      const { hsdStock } = jsondata;

      const hsdStockObj = {
        id,
        fireEngineOpeningBalance125KVA: hsdStock.fireEngineOpeningBalance125KVA,
        fireEngineClosingBalance125KVA: hsdStock.fireEngineClosingBalance125KVA,
        dgOpeningBalance250KVA: hsdStock.dgOpeningBalance250KVA,
        dgClosingBalance250KVA: hsdStock.dgClosingBalance250KVA,
        dgFreshStockProcured250KVA: hsdStock.dgFreshStockProcured250KVA,
        fireEngineFreshStockProcured125KVA: hsdStock.fireEngineFreshStockProcured125KVA,
        date: date.slice(0, -1),
        facilityId: facilityId  // Include facilityId in the hsdStockObj
      };
      
      const hsdStockQuery = `INSERT INTO hsdStockTest (
          id,
          fireEngineClosingBalance125KVA,
          dgClosingBalance250KVA,
          dgFreshStockProcured250KVA,
          fireEngineFreshStockProcured125KVA,
          date,
          fireEngineOpeningBalance125KVA,
          dgOpeningBalance250KVA,
          facilityId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      await dbConnection.execute(hsdStockQuery, [
        hsdStockObj.id,
        hsdStockObj.fireEngineClosingBalance125KVA,
        hsdStockObj.dgClosingBalance250KVA,
        hsdStockObj.dgFreshStockProcured250KVA,
        hsdStockObj.fireEngineFreshStockProcured125KVA,
        hsdStockObj.date,
        hsdStockObj.fireEngineOpeningBalance125KVA,
        hsdStockObj.dgOpeningBalance250KVA,
        hsdStockObj.facilityId  // Include facilityId in the values list
      ]);
      

      // //   //   // //dg status

      const { dgStatus } = jsondata;

      async function fetchPreviousDayDgStatus(currentDate) {
        const previousDate = new Date(currentDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const formattedPreviousDate = previousDate.toISOString();

        const previousDayDgStatusQuery = `
          SELECT COALESCE(presentDG250KVA, 0) AS presentDG250KVA,
                COALESCE(presentFireEngine125KVA, 0) AS presentFireEngine125KVA
          FROM dgStatus
          WHERE date = ?
          ORDER BY date DESC
          LIMIT 1
        `;

        const [exactPreviousDayDgStatusRows] = await dbConnection.execute(
          previousDayDgStatusQuery,
          [formattedPreviousDate]
        );

        // Return zero if no data found for the previous day
        return   exactPreviousDayDgStatusRows[0] || {
        
          presentDG250KVA: 0,
          presentFireEngine125KVA: 0,
        };
      }

      const previousDayDgStatus = await fetchPreviousDayDgStatus(
        date.slice(0, -1)
      );

      const dgStatusObject = {
        id,
        previousDG250KVA: previousDayDgStatus.presentDG250KVA,
        previousFireEngine125KVA: previousDayDgStatus.presentFireEngine125KVA,
        presentDG250KVA: dgStatus.dg250KVA,
        presentFireEngine125KVA: dgStatus.fireEngine125KVA,
        dgRunningHrs250KVA: dgStatus.dgRunningHrs250KVA,
        fireEngineRunningHrs125KVA: dgStatus.fireEngineRunningHrs125KVA,
        date: date.slice(0, -1),
      };

      const dgStatusQuery = `
        INSERT INTO dgStatusTest (
          id,
          previousDG250KVA,
          previousFireEngine125KVA,
          presentDG250KVA,
          presentFireEngine125KVA,
          dgRunningHrs250KVA,
          fireEngineRunningHrs125KVA,
          date,
          facilityId
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
      `;

      // // Execute the insertion query
      await dbConnection.execute(dgStatusQuery, [
        dgStatusObject.id,
        dgStatusObject.previousDG250KVA,
        dgStatusObject.previousFireEngine125KVA,
        dgStatusObject.presentDG250KVA,
        dgStatusObject.presentFireEngine125KVA,
        dgStatusObject.dgRunningHrs250KVA,
        dgStatusObject.fireEngineRunningHrs125KVA,
        dgStatusObject.date,
        facilityId
      ]);

      // //   // //   // //DG B Check

      const { dgBCheck } = jsondata;

      const dgBCheckObj = {
        id,
        dgRunningHrs250KVA: dgBCheck.dgRunningHrs250KVA,
        fireEngineRunningHrs125KVA: dgBCheck.fireEngineRunningHrs125KVA,
        dgNextBCheck250KVA: dgBCheck.dgNextBCheck250KVA,
        fireEngineNextBCheck125KVA: dgBCheck.fireEngineNextBCheck125KVA,
        date: date.slice(0, -1),
      };

      const dgBQuery = `INSERT INTO dgBCheckTest (id,dgRunningHrs250KVA,fireEngineRunningHrs125KVA,dgNextBCheck250KVA,fireEngineNextBCheck125KVA,date,facilityId)
        VALUES(?,?,?,?,?,?,?) `;

      await dbConnection.execute(dgBQuery, [
        dgBCheckObj.id,
        dgBCheckObj.dgRunningHrs250KVA,
        dgBCheckObj.fireEngineRunningHrs125KVA,
        dgBCheckObj.dgNextBCheck250KVA,
        dgBCheckObj.fireEngineNextBCheck125KVA,
        dgBCheckObj.date,
        facilityId
      ]);

      // //   //   // //STP Report

      const { kld65, kld90 } = jsondata;

      const waterConsumptionBySTPCapacityArray = [
        {
          id: parseInt(id),
          stpCapacity: "65KLD",
          inletReadingClosing: parseFloat(kld65.inletReadingClosing),
          inletReadingOpening: parseFloat(kld65.inletReadingOpening),
          outletReadingClosing: parseFloat(kld65.outletReadingClosing),
          outletReadingOpening: parseFloat(kld65.outletReadingOpening),
          waterHardnessPPM: parseFloat(kld65.waterHardnessPPM),
          waterTDSPPM: parseFloat(kld65.waterTDSPPM),
          ph: parseFloat(kld65.ph).toFixed(1),
          date: date.slice(0, -1),
        },
        {
          id: parseInt(id),
          stpCapacity: "90KLD",
          inletReadingClosing: parseFloat(kld90.inletReadingClosing),
          inletReadingOpening: parseFloat(kld90.inletReadingOpening),
          outletReadingClosing: parseFloat(kld90.outletReadingClosing),
          outletReadingOpening: parseFloat(kld90.outletReadingOpening),
          waterHardnessPPM: parseFloat(kld90.waterHardnessPPM),
          waterTDSPPM: parseFloat(kld90.waterTDSPPM),
          ph: parseFloat(kld90.ph).toFixed(1),
          date: date.slice(0, -1),
        },
      ];
      console.log(
        waterConsumptionBySTPCapacityArray[0].ph,
        waterConsumptionBySTPCapacityArray[1].ph
      );

      const stpReportQuery = `INSERT INTO stpReportTest(id, stpCapacity, inletReadingClosing,
          inletReadingOpening, outletReadingClosing, outletReadingOpening,
          waterHardnessPPM, waterTDSPPM, ph, date,facilityId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

      await Promise.all(
        waterConsumptionBySTPCapacityArray.map((data) =>
          dbConnection.execute(stpReportQuery, [
            data.id,
            data.stpCapacity,
            data.inletReadingClosing,
            data.inletReadingOpening,
            data.outletReadingClosing,
            data.outletReadingOpening,
            data.waterHardnessPPM,
            data.waterTDSPPM,
            data.ph,
            data.date,
            facilityId
          ])
        )
      );

      //  //CCTV  Status

      const {
        cctv1Status,
        cctv2Status,
        cctv3Status,
        cctv4Status,
        cctv5Status,
        cctv6Status,
        cctv7Status,
        cctv8Status,
        cctv9Status,
        cctv10Status,
        cctv11Status,
        cctv12Status,
        reason1,
        reason2,
        reason3,
        reason4,
        reason5,
        reason6,
        reason7,
        reason8,
        reason9,
        reason10,
        reason11,
        reason12,
      } = jsondata;

      const cctvDetailsArray = [
        {
          id,
          cctv: "cctv-1",
          cctvStatus: cctv1Status,
          reason: cctv1Status === "Not Working" ? reason1 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-2",
          cctvStatus: cctv2Status,
          reason: cctv2Status === "Not Working" ? reason2 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-3",
          cctvStatus: cctv3Status,
          reason: cctv3Status === "Not Working" ? reason3 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-4",
          cctvStatus: cctv4Status,
          reason: cctv4Status === "Not Working" ? reason4 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-5",
          cctvStatus: cctv5Status,
          reason: cctv5Status === "Not Working" ? reason5 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-6",
          cctvStatus: cctv6Status,
          reason: cctv6Status === "Not Working" ? reason6 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-7",
          cctvStatus: cctv7Status,
          reason: cctv7Status === "Not Working" ? reason7 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-8",
          cctvStatus: cctv8Status,
          reason: cctv8Status === "Not Working" ? reason8 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-9",
          cctvStatus: cctv9Status,
          reason: cctv9Status === "Not Working" ? reason9 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-10",
          cctvStatus: cctv10Status,
          reason: cctv10Status === "Not Working" ? reason10 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-11",
          cctvStatus: cctv11Status,
          reason: cctv11Status === "Not Working" ? reason11 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          cctv: "cctv-12",
          cctvStatus: cctv12Status,
          reason: cctv12Status === "Not Working" ? reason12 : "N/A",
          date: date.slice(0, -1),
        },
      ];
      // //   console.log(cctvDetailsArray)

      const cctvQuery = `INSERT INTO cctvTest (id, cctv, cctvStatus, date, reason,facilityId) VALUES (?,?,?,?,?,?)`;

      await Promise.all(
        cctvDetailsArray.map((data) =>
          dbConnection.execute(cctvQuery, [
            data.id,
            data.cctv,
            data.cctvStatus,
            data.date,
            data.reason,
            facilityId
          ])
        )
      );

      // //   //   // //UPS STATUS
      const { upsStatus } = jsondata;
      const { rating, maxLoad, batteryVoltage, serviceDate } = upsStatus;

      const upsObject = {
        id,
        rating: parseFloat(rating),
        maxLoad: parseFloat(maxLoad),
        batteryVoltage: parseFloat(batteryVoltage),
        serviceDate,
        date: date.slice(0, -1),
      };

      const upsQuery = `INSERT INTO upsReportTest(id,rating,maxLoad,batteryVoltage,serviceDate,date,facilityId)
            VALUES(?,?,?,?,?,?,?) `;

      await dbConnection.execute(upsQuery, [
        upsObject.id,
        upsObject.rating,
        upsObject.maxLoad,
        upsObject.batteryVoltage,
        upsObject.serviceDate,
        upsObject.date,
      facilityId
      ]);

      // //   //   // // Ground Water Tank Status

      const { statusPercentage1, statusPercentage2, statusPercentage3 } =
        jsondata;

      const groundWaterTankArray = [
        {
          id,
          tankName: "domesticWaterTank",
          statusPercentage: parseInt(statusPercentage1),
          date: date.slice(0, -1),
        },
        {
          id,
          tankName: "fireWaterTank-1",
          statusPercentage: parseInt(statusPercentage2),
          date: date.slice(0, -1),
        },
        {
          id,
          tankName: "fireWaterTank-2",
          statusPercentage: parseInt(statusPercentage3),
          date: date.slice(0, -1),
        },
      ];
      const groundWaterTankQuery = `INSERT INTO groundWaterReportTest (id,tankName,statusPercentage,date,facilityId)
            VALUES(?,?,?,?,?)`;

      await Promise.all(
        groundWaterTankArray.map((data) =>
          dbConnection.execute(groundWaterTankQuery, [
            data.id,
            data.tankName,
            data.statusPercentage,
            data.date,
            facilityId
          ])
        )
      );

      // //   //   // //Critical Equipment

      const { transformer, ups, dg, remarks1, remarks2, remarks3 } = jsondata;

      const criticalEquipmentArray = [
        {
          id,
          criticalEquipment: "transformer",
          workingStatus: transformer,
          remarks: transformer === "Non-operational" ? remarks1 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          criticalEquipment: "ups",
          workingStatus: ups,
          remarks: ups === "Non-operational" ? remarks2 : "N/A",
          date: date.slice(0, -1),
        },
        {
          id,
          criticalEquipment: "dg",
          workingStatus: dg,
          remarks: dg === "Non-operational" ? remarks3 : "N/A",
          date: date.slice(0, -1),
        },
      ];
      // console.log(criticalEquipmentArray);

      const criticalEquipmentQuery = `INSERT INTO criticalEquipmentReportTest (id, criticalEquipment, workingStatus, date, remarks,facilityId) VALUES (?,?,?,?,?,?)`;

      await Promise.all(
        criticalEquipmentArray.map((data) =>
          dbConnection.execute(criticalEquipmentQuery, [
            data.id,
            data.criticalEquipment,
            data.workingStatus,
            data.date,
            data.remarks,
            facilityId
          ])
        )
      );

      // //   //   //Breakdown Status

      const { breakdownStatus } = jsondata;

      if (breakdownStatus === true) {
        const { breakdownDetails } = jsondata;

        const {
          projectName,
          projectDetails,
          breakdownOnDate,
          dateOfEscalation,
        } = breakdownDetails;
        const breakdownQuery = `INSERT INTO breakdownStatusReportTest (id,breakdownStatus, projectName, projectDetails, breakdownOnDate, dateOfEscalation,date,facilityId)
          VALUES (?,?, ?, ?, ?, ?,?,?)`;

        await dbConnection.execute(breakdownQuery, [
          id,
          "Yes",
          projectName,
          projectDetails,
          breakdownOnDate,
          dateOfEscalation,
          date.slice(0, -1),
          facilityId
        ]);
      } else {
        const defaultValues = ["N/A", "N/A", "N/A", "N/A"];

        const breakdownQuery = `INSERT INTO breakdownStatusReportTest (id,breakdownStatus, projectName, projectDetails, breakdownOnDate, dateOfEscalation,date,facilityId)
                                  VALUES (?,?, ?, ?, ?, ?,?,?)`;

        await dbConnection.execute(breakdownQuery, [
          id,
          "No",
          ...defaultValues,
          date.slice(0, -1),
          facilityId
        ]);
      }

      // //   // //   //Activity Status

      const { activityDetails, activityDate } = jsondata;

      const parsedDate = new Date(activityDate);

      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const day = String(parsedDate.getDate()).padStart(2, "0");
      const hours = String(parsedDate.getHours()).padStart(2, "0");
      const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
      const seconds = "00";
      const formattedActivityDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const activityObj = {
        id,
        activityDetails,
        activityDate: formattedActivityDate,
      };

      const activityQuery = `INSERT INTO activityReportTest (id, activityDetails, activityDate,facilityId)
         VALUES(?,?,?,?)`;

      await dbConnection.execute(activityQuery, [
        activityObj.id,
        activityObj.activityDetails,
        activityObj.activityDate,
        facilityId
      ]);
    }
 
   
    return {
      statusCode: 200,
      body: JSON.stringify({message:"Date Inserted Successfully"}),
    
    };



  }
  catch(error){
    console.log("Error",error)
    return{
      statusCode:500,
      body:JSON.stringify({message:error.message})
    }
  }
  };
  