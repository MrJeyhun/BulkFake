import {
  ChangeEvent,
  UIEventHandler,
  useContext,
  useEffect,
  useState,
} from "react";
import { createFakeData } from "@app/utils";
import { faker } from "@faker-js/faker";
import { FakerTypes, RegionCode, Regions } from "@app/types/enums";
import { AppContext } from "./App";
import Table from "@app/components/Table";
import { AppContextShape, FakedData } from "@app/types/types";

const Main = () => {
  const { errorRange, seed, region, csvData, setCsvData } = useContext(
    AppContext
  ) as AppContextShape;
  const [pages, setPages] = useState(1);
  let timeoutId: number;

  const finalData: FakedData[] = [];
  faker.seed(Number(seed));

  const newFakeData = () => {
    const entry = () => {
      const city = faker.datatype.number({ max: 10 });

      return createFakeData(
        faker.datatype.uuid(),
        faker.name.fullName(),
        `${
          city >= 7 ? `${faker.address.cityName()},` : ""
        }  ${faker.address.streetAddress(faker.datatype.boolean())}`,
        faker.phone.number()
      );
    };

    switch (region) {
      case Regions.US:
        faker.setLocale(RegionCode.USA);
        break;
      case Regions.GE:
        faker.setLocale(RegionCode.GERMANY);
        break;
      case Regions.PL:
        faker.setLocale(RegionCode.POLAND);
        break;
      case Regions.AZ:
        faker.setLocale(RegionCode.AZ);
        break;
    }

    return entry();
  };

  const createFakeDatas = (entriesCount = 21) => {
    return Array.from({ length: entriesCount }, newFakeData);
  };

  const scrambleString = (str: string, type: FakerTypes) => {
    const iterations = [str];

    const removeCharacter = () => {
      const lastIteration = iterations[iterations.length - 1];
      const charToChange = faker.datatype.number({
        max: iterations[iterations.length - 1].length,
      });

      const updatedString =
        lastIteration.substring(0, charToChange - 1) +
        lastIteration.substring(charToChange);
      iterations.push(updatedString);
    };

    const addCharacter = () => {
      const lastIteration = iterations[iterations.length - 1];
      const whereToAdd = faker.datatype.number({ max: str.length });

      const randomName = faker.name.fullName();

      const randomStreet = faker.address.street();

      const randomCharacter = (s: string) =>
        faker.datatype.number({ max: s.length - 3 });
      let charToAdd;

      switch (type) {
        case FakerTypes.ID:
          charToAdd = faker.random.alpha(1);
          break;
        case FakerTypes.NAME:
          charToAdd = randomName[randomCharacter(randomName)];
          break;
        case FakerTypes.ADDRESS:
          charToAdd = randomStreet[randomCharacter(randomStreet)];
          break;
        case FakerTypes.NUMBER:
          charToAdd = faker.datatype.number({ min: 0, max: 9 });
          break;
      }

      const updatedString =
        lastIteration.substring(0, whereToAdd) +
        charToAdd +
        lastIteration.substring(whereToAdd);
      iterations.push(updatedString);
    };

    const swapCharacter = () => {
      const lastIteration = iterations[iterations.length - 1];
      const charToSwap = faker.datatype.number({ max: str.length });
      const updatedString =
        lastIteration.substring(0, charToSwap - 1) +
        lastIteration.substring(charToSwap, charToSwap + 1) +
        lastIteration.substring(charToSwap, charToSwap - 1) +
        lastIteration.substring(charToSwap + 1);
      iterations.push(updatedString);
    };

    const operation = faker.datatype.number({ max: 2 });

    if (operation === 0) removeCharacter();
    if (operation === 1) addCharacter();
    if (operation === 2) swapCharacter();

    return iterations[iterations.length - 1];
  };

  const addErrors = (input: FakedData[]) => {
    const postError = input.slice(1).map((el: FakedData) => {
      const iterID = [el.id];
      const iterName = [el.fullName];
      const iterAddress = [el.address];
      const iterPhone = [el.phone];

      let float = false;
      let errors: number = 0;

      if (Number.isInteger(errorRange)) {
        float = false;
        errors = errorRange;
      }
      if (!Number.isInteger(errorRange)) {
        float = true;
        errors = errorRange + 0.5;
      }

      const inroduceErrors = (count: number) => {
        for (let i = 0; i < count; i++) {
          const lastIterationID = iterID[iterID.length - 1];
          const lastIterationName = iterName[iterName.length - 1];
          const lastIterationAddress = iterAddress[iterAddress.length - 1];
          const lastIterationPhone = iterPhone[iterPhone.length - 1];
          const fieldToChange = faker.datatype.number({ max: 3 });

          switch (fieldToChange) {
            case 0:
              iterID.push(
                scrambleString(lastIterationID, FakerTypes.ID).substring(0, 40)
              );
              break;
            case 1:
              iterName.push(
                scrambleString(lastIterationName, FakerTypes.NAME).substring(
                  0,
                  40
                )
              );
              break;
            case 2:
              iterAddress.push(
                scrambleString(
                  lastIterationAddress,
                  FakerTypes.ADDRESS
                ).substring(0, 40)
              );
              break;
            case 3:
              iterPhone.push(
                scrambleString(lastIterationPhone, FakerTypes.NUMBER).substring(
                  0,
                  40
                )
              );
              break;
          }
        }
      };

      if (float) {
        const randomBool = faker.datatype.boolean();
        randomBool ? inroduceErrors(errors) : inroduceErrors(errors - 1);
      }
      if (!float) inroduceErrors(errors);

      el.id = iterID[iterID.length - 1];
      el.fullName = iterName[iterName.length - 1];
      el.address = iterAddress[iterAddress.length - 1];
      el.phone = iterPhone[iterPhone.length - 1];

      return el;
    });

    return postError;
  };

  const renderDatas = (): FakedData[] => {
    for (let i = 0; i < pages; i++) {
      finalData.push(...createFakeDatas());
    }
    return addErrors(finalData);
  };

  const setCsvDataWithDelay = (data: FakedData[]) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      setCsvData(data);
    }, 2000);
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    setCsvDataWithDelay(finalData);

    if (
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
      e.currentTarget.clientHeight
    ) {
      setPages(pages + 1);
    }
  };

  useEffect(() => {
    setCsvData(finalData);
  }, []);

  return (
    <div>
      <Table fakeDatas={renderDatas()} handleScroll={handleScroll} />
    </div>
  );
};

export default Main;
