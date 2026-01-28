import random
import string

def generate_random_string(length=10):
    """Generate a random string of specified length."""
    return ''.join(random.choice(string.ascii_letters) for _ in range(length))

def roll_dice(num_dice=2, sides=6):
    """Simulate rolling dice."""
    return [random.randint(1, sides) for _ in range(num_dice)]

def shuffle_list(items):
    """Shuffle a list randomly."""
    random.shuffle(items)
    return items

if __name__ == "__main__":
    print(f"Random string: {generate_random_string(15)}")
    print(f"Dice roll: {roll_dice()}")
    print(f"Shuffled: {shuffle_list([1, 2, 3, 4, 5])}")