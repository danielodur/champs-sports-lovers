import AsyncStorage from "@react-native-async-storage/async-storage";
import { FixtureEvent } from "../types/football-fixtures-response";

export interface GoalData {
  fixtureId: number;
  events: FixtureEvent[];
}

/*
Lets make a nice goal service that holds fixtureEvent and fitureId ref the interface above saves the GoalData[] in Asyncstorage and checks if new event also exists in the saved goalData, if not add it trigger a function that will be defined in matchItem to signal goal scored in the ui and and the same thing for goal Var goal Event for cancelled goal, also need a method that send a notification to display goal data.
*/

class GoalService {
  private goalData: GoalData[] | undefined;

  constructor() {
    this.goalData = [];
  }

  private async saveGoalData(goalData: GoalData) {
    if (!(await this.checkIfGoalDataExists(goalData.fixtureId))) {
      this.goalData?.push(goalData);
    } else {
      return;
    }
    await AsyncStorage.setItem("goalData", JSON.stringify(this.goalData));
    console.log("goalData saved", this.goalData);
  }

  async getGoalData(fixtureId: number) {
    const goalData = await AsyncStorage.getItem("goalData");
    if (goalData) {
      this.goalData = JSON.parse(goalData).filter(
        (goal: GoalData) => goal.fixtureId === fixtureId
      );
      return this.goalData;
    }
  }

  async getAllGoalData() {
    const goalData = await AsyncStorage.getItem("goalData");
    console.log("goalData", goalData);
    if (goalData) {
      return JSON.parse(goalData) as GoalData[];
    }
  }

  private async checkIfGoalDataExists(fixtureId: number) {
    const goalData = await this.getGoalData(fixtureId);
    return goalData?.some((goal) => goal.fixtureId === fixtureId);
  }

  async addGoalData(goalData: GoalData) {
    await this.saveGoalData(goalData);
  }

  async removeGoalData(fixtureId: number) {
    const goalData = await this.getGoalData(fixtureId);
    this.goalData = goalData?.filter((goal) => goal.fixtureId !== fixtureId);
    await AsyncStorage.setItem("goalData", JSON.stringify(this.goalData));
  }

  // Compare latest events from each fixture and check if there is a new goal
  async compareLatestEvents(
    fixtureId: number,
    events: FixtureEvent[]
  ): Promise<"goal_scored" | "goal_cancelled" | undefined> {
    const goalData = await this.getGoalData(fixtureId);
    const fixtureGoalData = goalData?.find(
      (goal) => goal.fixtureId === fixtureId
    );
    if (fixtureGoalData) {
      const latestEvent = events[events.length - 1];
      if (
        latestEvent.type === "Goal" &&
        !fixtureGoalData.events.some(
          (event) => event.time.elapsed === latestEvent.time.elapsed
        )
      ) {
        await this.addGoalData({
          fixtureId,
          events: [latestEvent],
        });

        return "goal_scored";
      } else if (
        latestEvent.type === "Var" &&
        fixtureGoalData.events.some(
          (event) => event.time.elapsed === latestEvent.time.elapsed
        )
      ) {
        await this.addGoalData({
          fixtureId,
          events: [latestEvent],
        });
        return "goal_cancelled";
      }
    }
  }
}

const goalService = new GoalService();

export default goalService;
