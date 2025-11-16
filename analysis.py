import random
from collections import defaultdict

anslist = ["anpa", "ante", "awen", "esun", "insa", "jaki", "jelo", "kala", "kama", "kasi", "kili", "kule", "kute", "lape", "laso", "lawa", "leko", "lete", "lili", "lipu", "loje", "luka", "lupa", "mama", "mani", "meli", "meso", "mije", "moku", "moli", "musi", "mute", "nasa", "nena", "nimi", "noka", "olin", "open", "pali", "pana", "pini", "pipi", "poka", "poki", "pona", "sama", "seli", "selo", "seme", "sewi", "sike", "sina", "soko", "sona", "suli", "suno", "supa", "suwi", "taso", "tawa", "telo", "toki", "tomo", "unpa", "walo", "waso", "wawa", "weka", "wile"]

def get_word():
    return random.choice(anslist)

def get_feedback(guess, answer):
    feedback = ['B'] * len(guess)
    answer_chars = list(answer)
    
    for i in range(len(guess)):
        if guess[i] == answer[i]:
            feedback[i] = 'G'
            answer_chars[i] = None  

    for i in range(len(guess)):
        if feedback[i] == 'B' and guess[i] in answer_chars:
            feedback[i] = 'Y'
            answer_chars[answer_chars.index(guess[i])] = None 
    
    return feedback

def is_possible_word(word, guesses, feedbacks):
    must_be = [None] * len(word)
    cannot_be = [set() for _ in range(len(word))]
    must_include = set()
    min_counts = defaultdict(int)
    max_counts = defaultdict(int)
    truly_absent = set()

    for guess, feedback in zip(guesses, feedbacks):
        letter_count_in_word = defaultdict(int)
        
        for i, (g, f) in enumerate(zip(guess, feedback)):
            if f == 'G':
                must_be[i] = g
                must_include.add(g)
                letter_count_in_word[g] += 1
            elif f == 'Y':
                cannot_be[i].add(g)
                must_include.add(g)
                letter_count_in_word[g] += 1
            elif f == 'B':
                truly_absent.add(g)
                for i in range(len(word)):
                    cannot_be[i].add(g)
                max_counts[g] = 0

        for letter, count in letter_count_in_word.items():
            min_counts[letter] = max(min_counts[letter], count)

    for letter in truly_absent:
        if letter in word:
            return False

    letter_count_in_word = defaultdict(int)
    for i, l in enumerate(word):
        if must_be[i] is not None and must_be[i] != l:
            return False
        if l in must_include:
            letter_count_in_word[l] += 1
        if l in truly_absent:
            return False
        if l in cannot_be[i]:
            return False
    for letter, count in min_counts.items():
        if letter_count_in_word[letter] < count:
            return False
    for letter, count in max_counts.items():
        if letter_count_in_word[letter] > count:
            return False
    return True

def update_possible_words(possible_words, guesses, feedbacks):
    return [word for word in possible_words if is_possible_word(word, guesses, feedbacks)]

def analyze_best_guesses():
    possible_words = anslist[:]
    guesses = []
    feedbacks = []
    
    while possible_words:
        guess = random.choice(possible_words)
        print(f"Guess: {guess}")
        feedback = get_feedback(guess, answer)
        print(f"Feedback: {feedback}")
        
        guesses.append(guess)
        feedbacks.append(feedback)
        
        possible_words = update_possible_words(possible_words, guesses, feedbacks)
        
        if guess == answer:
            print(f"Correct! The word was {answer}")
            break
        
        print(f"Possible words left: {len(possible_words)}")

if __name__ == '__main__':
    answer = get_word()
    print(f"The answer is: {answer}")
    analyze_best_guesses()
