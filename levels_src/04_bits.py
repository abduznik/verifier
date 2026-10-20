# level: bits
# title: Bit Reader
# desc: Decode the binary. Eight bits, one letter.
# prompt: 01000011 01000001 01010100
# answer: CAT

def solve(prompt):
    return "".join(chr(int(b, 2)) for b in prompt.split())
