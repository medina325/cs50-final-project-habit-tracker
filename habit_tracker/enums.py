from enum import Enum

class HabitState(Enum):
    TRACKED = 'tracked'
    NOT_TRACKED = 'notTracked'

    @staticmethod
    def is_valid_key(state) -> bool:
        return state in HabitState
    
    @staticmethod
    def get_key_from_value(value: str):
        if value == 'tracked':
            return HabitState.TRACKED

        if value == 'notTracked':
            return HabitState.NOT_TRACKED

        return None
