# level: power_of_two
# title: Power of Two
# desc: What power of two is this? Answer with the exponent.
# prompt: 512
# answer: 9

def solve(prompt):
    n, e = int(prompt), 0
    while n > 1 and n % 2 == 0:
        n //= 2
        e += 1
    return str(e)
