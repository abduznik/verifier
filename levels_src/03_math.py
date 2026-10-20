# level: math_gate
# title: Math Gate
# desc: Not a calculator. Prove it.
# prompt: 17 * 3
# answer: 51

def solve(prompt):
    a, op, b = prompt.split()
    return str({"*": int(a) * int(b), "+": int(a) + int(b), "-": int(a) - int(b)}[op])
