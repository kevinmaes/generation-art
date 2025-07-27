THE GEDCOM STANDARD

Release 5.5.1

Prepared by the
Family History Department
The Church of 
Jesus Christ 
of Latter-day Saints

15 November 2019

Suggestions and Correspondence:

Email:
gedcom@ChurchOfJesusChrist.org

Telephone:
801-240-0770

Mail:
Family History Department
Solution Provider Coordinator
15 South Temple Street
Salt Lake City, UT 84150 USA

Copyright © 1987, 1989, 1992, 1993, 1995, 1999, 2019 by The Church of Jesus Christ of Latter-day Saints. This document may be 
copied for purposes of review or programming of genealogical software, provided this notice is included. All other rights reserved.

TABLE OF CONTENTS

Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
Purpose and Content of The GEDCOM Standard . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
Purposes for Version 5.x . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
Modifications in Version 5.5.1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6

Chapter 1

Data Representation Grammar . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Concepts . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Grammar . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Description of Grammar Components . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14

Chapter 2

Lineage-Linked Grammar . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 19
Record Structures of the Lineage-Linked Form . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 23
Substructures of the Lineage-Linked Form . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 31
Primitive Elements of the Lineage-Linked Form . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 41
Compatibility with Other GEDCOM Versions . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 67
Modifications in Version 5.5 as a result of the 5.4 (draft) review . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 69
Changes Introduced or Modified in Draft Version 5.4 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 70
Changes Introduced in Draft Version 5.3 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 72
Packaging the GEDCOM Transmission File . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 73
Sample Lineage-Linked GEDCOM Transmission . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74

Chapter 3

Using Character Sets in GEDCOM . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 77
8-Bit ANSEL . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 77
ASCII (USA Version) . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78
UNICODE 
UTF-8 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 79

Chapter 4

GEDCOM Product Registration . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 81
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 81
Registering GEDCOM Products

Appendix A . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 83
Lineage-Linked GEDCOM Tag Definition . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 83

Appendix B . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 96

LDS Temple Codes

  . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 96

Appendix C . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 97
ANSEL Character Set . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 97
Non-spacing graphic characters . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 97
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 99
Spacing graphic characters

Introduction

GEDCOM was developed by the Family History Department of The Church of Jesus Christ of Latter-
day Saints (LDS Church) to provide a flexible, uniform format for exchanging computerized
genealogical data. GEDCOM is an acronym for GEnealogical Data Communication. Its purpose is to
foster the sharing of genealogical information and the development of a wide range of inter-operable
software products to assist genealogists, historians, and other researchers.

Purpose and Content of The GEDCOM Standard

The GEDCOM Standard is a technical document written for computer programmers, system
developers, and technically sophisticated users. It covers the following topics:

! GEDCOM Data Representation Grammar (see Chapter 1 beginning on page 9)
! Lineage-Linked Grammar (see Chapter 2, beginning on page 19)
! Lineage-Linked GEDCOM Tags (see Appendix A, 83 and Chapter 2, beginning on page 19)
! The Church of Jesus Christ of Latter-day Saints' temple codes (see Appendix B, page 96)
! ANSEL Character Codes (see Chapter 3, beginning on page 77, and Appendix C beginning on

page 97)

This document describes GEDCOM at two different levels. Chapter 1 describes the lower level,  
known as the GEDCOM data format. This is a general-purpose data representation language for  
representing any kind of structured information in a sequential medium. It discusses the syntax and  
identification of structured information in general, but it does not deal with the semantic content of  
any particular kind of data. It is, therefore, also useful to people using GEDCOM for storing other  
types of data, not just genealogical data.

Chapter 2 of this document describes the higher level, known as a  GEDCOM form. Each type of data 
that uses the GEDCOM data format has a specific GEDCOM form. This document discusses only  
one GEDCOM form: the Lineage-Linked GEDCOM Form. This is the form commercial software  
developers use to create genealogical software systems that can exchange compiled information about  
individuals with accompanying family, source, submitter, and note records with the Family History  
Department's FamilySearch Systems and with each other if desired.

Purposes for Version 5.x

Earlier versions of  The GEDCOM Standard were released in October 1987 (3.0) and August 1989 
(4.0). Versions 1 and 2 were drafts for public discussion and were not established as a standard.

5

The 5.x series of drafts includes both the first standard definition of the Lineage-Linked GEDCOM
Form and also the first major expansion of the Lineage-Linked Form since its initial use in GEDCOM
3.0. The GEDCOM 5.x compatible systems should be able to read previous GEDCOM versions. See
"Compatibility with Previous GEDCOM Releases," (starting on page 67) for compatibility specifics.

Modifications in Version 5.5.1

! Editorial corrections.

! Added continuation tags to the header copyright tags (see <<HEADER>>, page 23.)

! Added email, fax, and web page addresses to the address structure (see

<<ADDRESS_STRUCTURE>>, page 31.)

! Added a status tag to the child to family link (see <<CHILD_TO_FAMILY_LINK>>, page

31.)

! Added a restriction notice tag to the family record to allow a source database to indicate why
data may not have been supplied in the transmission. (see <<FAMILY_RECORD>>, page 24.)
Also added a restriction notice tag to the <<EVENT_DETAIL>> structure page 32 to allow an
event to be flagged so that it can be treated in special ways such as not to be printed on reports.

! Added additional subordinate structure to the personal name structure  (see

<<PERSONAL_NAME_STRUCTURE>>, page 38.) These changes are in preparation for
handling more varied cultures as we move into the unicode character set environment.

! Added subordinate map coordinates and other additional changes to the place structure  (see

<<PLACE_STRUCTURE>>, page 38.) These changes are in preparation for handling more
varied cultures as we move into the unicode character set environment and to allow recording of
map coordinates to places such as burial cites.

! Added a subordinate affiliated religion tag to the event detail substructure (see

<<EVENT_DETAIL>>, page 32.)

! Added a generic FACT tag to the individual attribute structure. Previously, the generic EVEN
tag was used. The FACT was added to give a semantic difference between generic events and
generic facts or characteristics (see <<INDIVIDUAL_ATTRIBUTE_STRUCTURE>>, page
33.)

! Removed the option for encoding embedded multimedia objects. A file reference to a

multimedia file and its subordinate format and media types were added to the multimedia record.
Multiple file references can now be used to group related multimedia objects. This changed the
multimedia link by placing the FORM tag subordinate to the FILE tag rather than at the same

6

level. The BLOB tag was eliminated. See FILE tag and its subordinate FORM tag used in the
<<MULTIMEDIA_RECORD>> page 26 and the <<MULTIMEDIA_LINK>> page 37.

! The following tags were added:

EMAIL
FAX
FACT
FONE
ROMN
WWW
MAP
LATI
LONG

electronic mailing address
FAX address
A fact or characteristic.
Phonetic variation of a text.
Romanized variation of a text.
Web Home page address.
Pertaining to maps.
value of a latitudinal coordinate pertaining to the place of an event
value of a longitudinal coordinate pertaining to the place of an event.

! The following tag was removed:

BLOB

7

8

Chapter 1
Data Representation Grammar

Introduction

This chapter describes the core GEDCOM data representation language.

The generic data representation language defined in this chapter may be used to represent any form of
structured information, not just genealogical data, using a sequential stream of characters.

Concepts

A GEDCOM transmission represents a database in the form of a sequential stream of related records.
A record is represented as a sequence of tagged, variable-length lines, arranged in a hierarchy. A line
always contains a hierarchical level number, a tag, and an optional value. A line may also contain a
cross-reference identifier or a pointer. The GEDCOM line is terminated by a carriage return, a line
feed character, or any combination of these.

The tag in the GEDCOM line, taken in its hierarchial context, identifies the information contained in
the line, in the same sense that a field-name identifies a field in a database record. This means that the
data is self-defining. Tags allow a field to occur any number of times within a record, including zero
times. They also allow the use of different or new fields to be included in the GEDCOM data without
introducing incompatibility, because the receiving system will ignore data which it does not
understand and process only the data that it does understand.

The hierarchical relationships are indicated by a level number. Subordinate lines have a higher level
number. The hierarchy allows a line to have sub-lines, which in turn may have their own sub-lines, and
so forth. A line and its sub-lines constitute a context or enclosure, that is, a cluster of information
pertaining directly to the same thing. This hierarchical arrangement corresponds with the natural
hierarchy found in most structured information.

A series of one or more lines constitutes a record. The beginning of a new record is indicated by a
line whose level number is 0 (zero).

In addition to hierarchical relationships, GEDCOM defines the inter-record relationships that allow a
record to be logically related to other records, without introducing redundancy. These relationships
are represented by two additional, but optional, parts of a line: a cross-reference pointer and a cross-
reference identifier. The cross-reference pointer "points at" a related record, which is identified by a
required, matching unique cross-reference identifier. The cross-reference identifier is analogous to a
primary key in relational database terminology.

9

Grammar

This chapter defines the grammar for the GEDCOM format. The grammar is a set of rules that specify
the character sequences that are valid for creating the GEDCOM line. The character sequences are
described in terms of various combinations of elements (variables and/or constants). Elements may be
described in terms of a set of other elements, some of which are selected from a set of alternative
elements. Each element in the definition is separated by a plus sign (+) signifying that both elements
are required. When there is a choice of different elements that can be used, the set of alternatives are
listed between opening and closing square brackets ([]), with each choice separated by a vertical bar
([alternative_1 | alternative_2]). When there is only one alternative shown then the choice is optional,
that is, it is the same as [alternative_1 | <NULL>]. The user can read the grammar components of the
selected element by substituting any sub-elements until all sub-elements have been resolved.

A GEDCOM transmission consists of a sequence of logical records, each of which consists of a
sequence of gedcom_lines, all contained in a sequential file or stream of characters. The following
rules pertain to the gedcom_line:

Grammar Rules

! Long values can be broken into shorter GEDCOM lines by using a subordinate CONC or CONT
tag. The CONC tag assumes that the accompanying subordinate value is concatenated to the
previous line value without saving the carriage return prior to the line terminator. If a
concatenated line is broken at a space, then the space must be carried over to the next line.  The
CONT assumes that the subordinate line value is concatenated to the previous line, after inserting
a carriage return.

! The beginning of a new logical record is designated by a line whose level number is 0 (zero).

! Level numbers  must be between 0 to 99 and must not contain leading zeroes, for example, level

one must be 1, not 01.

! Each new level number must be no higher than the previous line plus 1.

! All GEDCOM lines have either a value or a pointer unless the line contains subordinate

GEDCOM lines. The presence of a level number and a tag alone should not be used to assert data
(i.e. 1 FLAG Y not just 1 FLAG  to imply that the flag is set).

! Logical GEDCOM record sizes should be constrained so that they will fit in a memory buffer of
less than 32K. GEDCOM files with records sizes greater than 32K run the risk of not being able
to be loaded in some programs.  Use of pointers to records, particularly NOTE records, should
ensure that this limit will be sufficient.

! Any length constraints are given in characters, not bytes.  When wide characters (characters

10

wider than 8 bits) are used, byte buffer lengths should be adjusted accordingly.

! The cross-reference ID has a maximum of 22 characters, including the enclosing ‘at’  signs (@),

and it must be unique within the GEDCOM transmission.

! Pointers to records imply that the record pointed to does actually exists within the transmission.
Future pointer structures may allow pointing to records within a public accessible database as an
alternative.

! The length of the GEDCOM TAG is a maximum of 31 characters, with the first 15 characters

being unique.

! The total length of a GEDCOM line, including level number, cross-reference number, tag, value,

delimiters, and terminator, must not exceed 255 (wide) characters.

! Leading white space (tabs, spaces, and extra line terminators) preceding a GEDCOM line should
be ignored by the reading system. Systems generating GEDCOM should not place any white
space in front of the GEDCOM line.

Grammar Syntax

A gedcom_line has the following syntax:

gedcom_line:=

level + delim + [optional_xref_ID] + tag + [optional_line_value] + terminator

for example:

1 NAME Will /Rogers/

The components used in the pattern above are defined below in alphabetical order. Some of the
components are defined in terms of other primitive patterns. The spaces used in the patterns below
are only to set them apart and are not a part of the resulting pattern. Character constants are specified
in the hex form (0x20) which is the ASCII hex value of a space character. Character constants that
are separated by a (-) dash represent any character with in that range from the first constant shown to
and including the second constant shown.

alpha:=

[(0x41)-(0x5A) | (0x61)-(0x7A) | (0x5F) ]
where:
(0x41)-(0x5A)=A to Z
(0x61)-(0x7A)=a to z

11

(0x5F)=(_) underscore

alphanum:=

[alpha | digit ]

any_char:=

[alpha | digit | otherchar | (0x23) | (0x20) | (0x40)+(0x40) ]
where:
(0x23)=#
(0x20)=space character
(0x40)+(0x40)=@@

delim:=

[(0x20) ]
where:
(0x20)=space_character

digit:=

[(0x30)-(0x39) ]

where:

(0x30)-(0x39) = One of the digits 0, 1,2,3,4,5,6,7,8,9

escape:=

[(0x40) + (0x23) + escape_text + (0x40) + non_at ]

where:

(0x40)=@
(0x23)=#

escape_text:=

[any_char | escape_text + any_char ]
The escape_text is coded to meet the rules of a particular GEDCOM form.

level:=

[digit | digit + digit ]
(Do not use non-significant leading zeroes such as 02.)

line_item:=

[any_char | escape | line_item + any_char | line_item + escape]

line_value:=

[ pointer | line_item ]

12

non_at:=

[alpha | digit | otherchar | (0x23) | (0x20 ) ]

where:

(0x20)=space character
(0x23)=#

null:= nothing

optional_line_value:= delim + line_value

optional_xref_ID:= xref_ID + delim

otherchar:=

[(0x21)-(0x22) | (0x24)-(0x2F) | (0x3A)-(0x3F) | (0x5B)-(0x5E) | (0x60) |  (0x7B)-(0x7E) |
(0x80)-(0xFE)]
where, respectively:

(0x21)-(0x22)=! "
(0x24)-(0x2F)=$ % & ' ( ) * + , - . /
(0x3A)-(0x3F)=: ; < = > ?
(0x5B)-(0x5E)=[ \ ] ^
(0x60)=`
(0x7B)-(0x7E)={ | } ~
(0x80)-(0xFE)=ANSEL characters above 127

Any 8-bit ASCII character except control characters (0x00–0x1F), alphanum, space ( ), number
sign (#), at sign (@), _ underscore, and the DEL character (0x7F).

pointer:=

[(0x40) + alphanum + pointer_string + (0x40) ]

where:

(0x40)=@

pointer_char:=
[non_at ]

pointer_string:=

[null | pointer_char | pointer_string + pointer_char ]

tag:=

[alphanum | tag + alphanum ]

13

terminator:=

[carriage_return | line_feed | carriage_return + line_feed |
line_feed + carriage_return ]

xref_ID:=
[pointer]

Description of Grammar Components

alpha:=

The alpha characters include the underscore, which is used to link word pieces together in
forming tag names or tag labels.

any_char:=

Any 8-bit ASCII character except the control characters found in the range of 0x00–0x1F and
0x7F.

delim:=

The delim (delimiter), a single space character, terminates both the variable-length level number
and the variable-length tag. Note that space characters may also be present in a value.

escape:=

The escape is a character sequence in the grammar used to specify special processing, such as for
switching character sets or for indicating an inclusion of a non-GEDCOM data form into the
GEDCOM structure. The form of the escape sequence is:

@+#+escape_text+@+non_at.

Receiving systems should discard any space character which follows the escape sequence’s
closing at-sign (@). If the character following the escape sequence's closing at-sign (@) is not a
space character then it should be kept as a part of the text following the escape.  Systems writing
escape sequences should always output a space character following the escape sequence.

The specific format of the escape sequence is defined for the specific GEDCOM form being
defined.

escape_text:=

The escape_text is defined to meet the requirements of a particular GEDCOM form.

level:=

The level number works the same way as the level of indentation in an indented outline, where
indented lines provide detail about the item under which they are indented. A line at any level L is

14

enclosed by and pertains directly to the nearest preceding line at level L-1. The Level L may
increase by 1 at most. Level numbers must not contain leading zeroes, for example level one must
be (1), not (01).

The enclosed subordinate lines at level L are said to be in the context of the enclosing superior
line at level L-1. The interpretation of a tag must be in the context of the tags of the enclosing
line(s) rather than just the tag by itself. Take the following record about an individual's birth and
death dates, for example:

0 INDI

1 BIRT

2 DATE 12 MAY 1920

1 DEAT

2 DATE 1960

In this example, the expression DATE 12 MAY 1920 is interpreted within the INDI (individual)
BIRT (birth) context, representing the individual's birth date. The second DATE is in the
INDI.DEAT (individual's death) context. The complete meaning of DATE depends on the
context.

Note:The above example is indented according to the level numbers to make the concept
more obvious. In the actual GEDCOM data, the level numbers are lined up vertically,
meaning they are the first character(s) of the GEDCOM line.

Some systems output indented GEDCOM data for better readability by putting space or tab
characters between the terminator and the level number of the next line to visibly show the
hierarchy. Also, some people have suggested allowing extra blank lines to visibly separate
physical records. GEDCOM files produced with these features are not to be used when
transmitting GEDCOM to other systems.

line_value:=

The line_value identifies an object within the domain of possible values allowed in the context of
the tag. The combination of the tag, the line_value, and the hierarchical context of the
supporting gedcom_lines provides the understanding of the enclosed values. This domain is
defined by a specific grammar for representing a given GEDCOM form. (See Chapter 2, starting
on page 19 for Lineage-Linked GEDCOM Form grammar.)

Values whose source information contains illegible parts of the value should be indicated by
replacing the illegible part with an ellipsis (...).

Values are generally not encoded in binary or other abbreviation schemes for reducing space
requirements, and they are generally constrained to be understandable by a typical user without
decoding. This is intended to reduce the decoding burden on the receiving software. A

15

GEDCOM-optimized data compression standard will be defined in the future to reduce space
requirements. Meanwhile, users may agree to compress and decompress GEDCOM files using
any compression system available to both sender and receiver.

The line_value within the context of a tag hierarchy of gedcom_lines represents one piece of
information and corresponds to one field in traditional database or file terminology.

otherchar:=

Any 8-bit ASCII character except control characters (0x00–0x1F), alphanum, space ( ),
number-sign (#), the at sign (@), and the DEL character (0x7F).

pointer:=

A pointer stands in the place of the record or context identified by the matching xref_ID.
Theoretically, a receiving system should be prepared to follow a pointer to find any needed
value in a manner that is transparent to the logic of the subsystem that is looking for specific
tags. This highly flexible facility will probably be used more in the future. For the time being,
however, the use of pointers is explicitly defined within the GEDCOM form, such as the
Lineage-Linked GEDCOM Form defined in Chapter 2 (see page 19).

The pointer represents the association between two objects that usually reside in different
records. Objects within a logical record can be associated. If this need exists, the pointer record
composition contains an exclamation point (!) that separates the parent record's cross-reference
ID from the specific substructure's cross-reference ID, which is at some subordinate level to the
logical record at level zero. The cross-reference ID of the substructure subordinate to a zero level
record, for inter-record associations is always composed of the Record ID number and the
Substructure ID number, such as @I132!1@. Including the Record ID number in the pointer that
associates objects within a record will allow the GEDCOM processors to build the index only at
the record level and then search sequentially for the appropriate substructure cross-reference ID.
The parent record ID is assumed when the cross-reference ID begins with a exclamation point (!)
signifying an intra-record association.

Complex logical record structures are divided into small physical records to accommodate
memory constraints, many-to-many relationships, and independent record creation and deletion.

The pointer must match a corresponding unique xref_ID within the transmission, unless the
colon (:) character is present (which will be used in the future as a network reference to a
permanent file record). A pointer is given instead of duplicating an object, though the logical
result is equivalent. An expanded traversal of a record tree includes following the pointer to
related records to some depth, and splicing those records (logically) into the resultant expanded
tree. Pointers may refer to either records which have not yet appeared in the transmission
(forward reference) or to records that have already appeared earlier in the transmission
(backward reference). This arrangement usually requires a preliminary pass to construct a look
up table to support random access by xref_ID during subsequent passes.

16

tag:=

A tag consists of a variable length sequence of alphanum characters. All user-defined tags that
have not been defined in the GEDCOM standard, must begin with an underscore character
(0x95).

The tag represents the meaning of the line_value within the context of the enclosing tags, and
contributes to the meaning of the enclosed subordinate lines. Specific tags are defined in
Appendix A (starting on page 83). The presence of a tag together with a value represents an
assertion which the submitter wishes to communicate to a receiver.  A tag without a value does
not represent an assertion.  If a tag is absent, no assertion is made.  Information of a negative
nature (such as knowing positively an event did not occur) is handled through the semantic
definition of a different tag and its accompanying value that assert the information explicitly.

Although formally defined tags are only three or four characters long, systems should prepare to
handle user tags of greater length. Tags will be unique within the first 15 characters.

Valid combinations of specific tags, line_values, xref_IDs, and pointers are constrained by the
GEDCOM form defined for representing a given kind of information. (See Chapter 2, starting on
page 19, for the Lineage-Linked GEDCOM Form grammar.)

terminator:=

The terminator delimits the variable-length line_value and signals the end of the gedcom_line.
The valid terminator characters are:

[carriage_return |
line_feed |
carriage_return + line_feed |
line_feed + carriage_return ]

xref_ID:=

(See pointer, page 16)
The xref_ID is formed by any arbitrary combination of characters from the pointer_char set.
The first character must be an alpha or a digit. The xref_ID is not retained in the receiving
system, and it may therefore be formed from any convenient combination of identifiers from the
sending system. No meaning is attributed by the receiver to any part of the xref_ID, other than its
unique association with the associated record. The use of the colon (:) character is also reserved.

Examples:

The following are examples of valid but unrelated GEDCOM lines:

0 @1234@ INDI

. . .
1 AGE 13y

17

. . .

1 CHIL @1234@

. . .

1 NOTE This is a note field that is

2 CONT continued on the next line.

The first line has a level number 0, a xref_ID of @1234@, an INDI tag, and no value.

The second line has a level number 1, no xref_ID, an AGE tag, and a value of 13.

The third line has a level number 1, no xref_ID, a CHIL tag, and a value of a pointer to a
xref_ID named @1234@.

18

Chapter 2
Lineage-Linked Grammar

Introduction

This chapter describes the specific tag, value, and pointer combinations used for exchanging family-
based lineage-linked genealogical information in the GEDCOM format. Lineage-linked data pertains
to individuals linked in family relationships across multiple generations. The chapter also addresses
specific compatibility issues pertaining to previous Lineage-Linked GEDCOM Form releases and
contains a simple lineage-linked GEDCOM transmission example.

The Lineage-Linked GEDCOM Form defined in this chapter is based on the general framework of the
GEDCOM data representation grammar defined in Chapter 1. Commercial genealogical software
systems are invited to use the Lineage-Linked GEDCOM Form to exchange data. It is the only form
approved for exchanging data with Ancestral File, TempleReady and other Family History resource
files maintained for this purpose.

Organization

The basic description of the Lineage-Linked GEDCOM Form's grammar is presented in the
following three major sections:

! "Record Structures of the Lineage-Linked Form" (beginning on page 23)
! "Substructures of the Lineage-Linked Form" (beginning on page 31)
! "Primitive elements of the Lineage-Linked Form" (beginning on page 41)

The definition of the tags used in defining the lineage-linked structures are contained in Appendix A.

Symbols Used in Chapter 2

The following symbols are used in Chapter 2:

<<double_angle bracket>>

Indicates that a subordinate GEDCOM structure pattern of either a record, structure, or
substructure is to be substituted in place of the line containing the enclosing double angle
brackets. The substitute structure pattern is found subordinate to the
LINEAGE_LINKED_GEDCOM beginning on page 24 for record pattern definition or in
alphabetical order under the "Substructures of the Lineage-Linked Form" section, beginning on
page 31.

<Single_angle bracket>

19

Indicates the name of the appropriate value for this GEDCOM line— <Primitive>. The specific
definition of this value is found in alphabetical order in "Primitive Elements of the Lineage-Linked
Form," beginning on page 41.

{braces}

Indicates the minimum to maximum occurrences allowed for this structure or
line— {Minimum:Maximum}. Note that minimum and maximum occurrence limits are defined
relative to the enclosing superior line. This means that a required line (minimum = 1) is not
required if the optional enclosing superior line is not present. Similarly, a line occurring only
once (maximum = 1) may occur multiple times as long as each occurs only once under its own
multiple-occurring superior line.

[Square brackets]

Indicates a choice of one or more options— [Choice of].

| vertical bar |

Separates the multiple choices, for example [Choice 1 | Choice 2].

n level number

A level number which assumes the level number of the line which referenced the substructure
name.

+1, +2 ...

A +1 level number is 1 greater than the level number assumed by the superior n level. A +2 level
number is 2 greater, and so forth.

0xHH

Indicates an allowable hexadecimal character value where HH is that value, for example, 0x20
(decimal 32) indicates the space character.

Lineage-Linked Form Usage Conventions

! The order in which GEDCOM lines are written to a GEDCOM file is controlled by the context
and level number.  When the lines are of equal level number but have a different tag name then
the order is not significant.  The occurrence of equal level numbers and equal tags within the
same context imply that multiple opinions or multiple values of the data exist. The significance of
the order in these cases is interpreted as the submitter's preference.  The most preferred value
being the first with the least preferred data listed in subsequent lines by order of decreasing
preference. For example, a researcher who discovers conflicting evidence about a person's birth
event would list the most credible information first and the least credible or least preferred items
last.

Systems that support multiple fields or structures should allow their users to indicate their

20

preference opinion. Systems that only store single value structures should use the preferred
information (the first occurrence listed) and store the remaining information as an exception,
preferably within an appropriate NOTE field or in some way that the patron has ready access to
the less-preferred data when viewing the record.

! Conflicting event dates and places should be represented by placing them in separate event

structures with appropriate source citations rather than by placing them under the same enclosing
event.

! The Lineage-Linked GEDCOM Form uses the TYPE tag to classify its superior tag for the

viewer. The value portion given by the TYPE tag is not intended to inform a computer program
how to process the data, unless there is a list of standardized or controlled line_value choices
given by the definition of the line value in this standard. The difference between an uncontroled
line value and a note value is that displaying systems should always display the type value when
they display the data from the associated context. This gives the user flexibility in further defining
information in a compatible GEDCOM context and the reader to understand events or facts
which have not been classified by a specific tag. For example:

1 EVEN

2 TYPE Awarded BSA Eagle Rank
2 DATE 1980

! All controlled line_value choices should be considered as case insensitive.

This means that the values should be converted to all uppercase or all lowercase prior to
comparing. The terms UPPERCASE and UpperCase are considered equal. TAGS are always
UPPERCASE.

! All GEDCOM lines have either a value or a pointer unless the line contains subordinate

GEDCOM lines. In other words the presence of a level number and a tag alone should not be
used to assert data (i.e. 1 DEAT Y should be used to imply a death known to have happened but
date and place are unknown,  not 1 DEAT ). The Lineage-linked form does not allow a
GEDCOM line with both a value and a pointer on the same line.

21

22

Record Structures of the Lineage-Linked Form

LINEAGE_LINKED_GEDCOM:=

This is a model of the lineage-linked GEDCOM structure for submitting data to other lineage-linked
GEDCOM processing systems. A header and a trailer record are required, and they can enclose any
number of data records. Tags from Appendix A (see page 83) must be used in the same context as
shown in the following form. User defined tags (see <NEW_TAG> on page 56) are discouraged but
when used must begin with an under-score. Tags that are required within a desired context have been 
bolded. Note that some contexts are not required but if they are used then the bolded tags are
required. 

0 <<HEADER>>
0 <<SUBMISSION_RECORD>>
0 <<RECORD>>
0 TRLR

HEADER:=
n HEAD

+1 SOUR <APPROVED_SYSTEM_ID>
+2 VERS <VERSION_NUMBER>
+2 NAME <NAME_OF_PRODUCT>
+2 CORP <NAME_OF_BUSINESS>
+3 <<ADDRESS_STRUCTURE>>
+2 DATA <NAME_OF_SOURCE_DATA>
+3 DATE <PUBLICATION_DATE>
+3 COPR <COPYRIGHT_SOURCE_DATA>

+4 [CONT|CONC]<COPYRIGHT_SOURCE_DATA>

+1 DEST <RECEIVING_SYSTEM_NAME>
+1 DATE <TRANSMISSION_DATE>

+2 TIME <TIME_VALUE>
+1 SUBM @<XREF:SUBM>@
+1 SUBN @<XREF:SUBN>@
+1 FILE <FILE_NAME>
+1 COPR <COPYRIGHT_GEDCOM_FILE>
+1 GEDC

+2 VERS <VERSION_NUMBER>
+2 FORM <GEDCOM_FORM>

+1 CHAR <CHARACTER_SET>

+2 VERS <VERSION_NUMBER>
+1 LANG <LANGUAGE_OF_TEXT>
+1 PLAC

+2 FORM <PLACE_HIERARCHY>

+1 NOTE <GEDCOM_CONTENT_DESCRIPTION>

{1:1}
{0:1}
{1:M}
{1:1}

{1:1}
{1:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1)
{0:1)
{0:M}
{0:1*
{0:1}
{0:1}
{1:1}
{0:1}
{0:1}
{0:1}
{1:1}
{1:1}
{1:1}
{1:1}
{0:1}
{0:1}
{0:1}
{1:1}
{0:1}

p.23
p.28
p.24

p.42
p.64
p.54
p.54
p.31
p.54
p.59
p.44
p.44
p.59
p.63
p.63
p.28
p.28
p.50
p.44

p.64
p.50
p.44
p.64
p.51

p.58
p.50

23

+2 [CONC|CONT] <GEDCOM_CONTENT_DESCRIPTION>

{0:M}

* NOTE:

Submissions to the Family History Department for Ancestral File submission or for clearing temple ordinances  must use a
DESTination of ANSTFILE or TempleReady, respectively.  

The header structure provides information about the entire transmission. The SOURce system name
identifies which system sent the data. The DESTination system name identifies the intended receiving
system.

Additional GEDCOM standards will be produced in the future to reflect GEDCOM expansion and
maturity. This requires the reading program to make sure it can read the GEDC.VERS and the
GEDC.FORM values to insure proper readability. The CHAR tag is required. All character codes
greater than 0x7F must be converted to ANSEL. (See Chapter 3, starting on page 77.)

RECORD:=

[ 
n <<FAM_RECORD>>
|
n <<INDIVIDUAL_RECORD>>
|
n <<MULTIMEDIA_RECORD>>
|
n <<NOTE_RECORD>>
|
n <<REPOSITORY_RECORD>>
|
n <<SOURCE_RECORD>>
|                                    
n <<SUBMITTER_RECORD>>
]

FAM_RECORD:=

n @<XREF:FAM>@ FAM

+1 RESN <RESTRICTION_NOTICE>
+1 <<FAMILY_EVENT_STRUCTURE>>
+1 HUSB @<XREF:INDI>@
+1 WIFE @<XREF:INDI>@
+1 CHIL @<XREF:INDI>@
+1 NCHI <COUNT_OF_CHILDREN>
+1 SUBM @<XREF:SUBM>@
+1 <<LDS_SPOUSE_SEALING>>
+1 REFN <USER_REFERENCE_NUMBER>

{1:1}

p.24

{1:1}

p.25

{1:1}

p.26

{1:1}

p.27

{1:1}

p.27

{1:1}

p.27

{1:1}

p.28

{1:1}
{0:1)
{0:M}
{0:1}
{0:1}
{0:M}
{0:1}
{0:M}
{0:M}
{0:M}

p.60
p.32
p.25
p.25
p.25
p.44
p.28
p.36
p.63, 64

24

+2 TYPE <USER_REFERENCE_TYPE>

+1 RIN <AUTOMATED_RECORD_ID>
+1 <<CHANGE_DATE>>
+1 <<NOTE_STRUCTURE>>
+1 <<SOURCE_CITATION>>
+1 <<MULTIMEDIA_LINK>>

{0:1}
{0:1}
{0:1}
{0:M}
{0:M}
{0:M}

p.64
p.43
p.31
p.37
p.39
p.37, 26

The FAMily record is used to record marriages, common law marriages, and family unions caused by
two people becoming the parents of a child. There can be no more than one HUSB/father and one
WIFE/mother listed in each FAM_RECORD. If, for example, a man participated in more than one
family union, then he would appear in more than one FAM_RECORD. The family record structure
assumes that the HUSB/father is male and WIFE/mother is female.

The preferred order of the CHILdren pointers within a FAMily structure is chronological by birth.

INDIVIDUAL_RECORD:=

n @XREF:INDI@ INDI

+1 RESN <RESTRICTION_NOTICE>
+1 <<PERSONAL_NAME_STRUCTURE>>
+1 SEX <SEX_VALUE>
+1 <<INDIVIDUAL_EVENT_STRUCTURE>>
+1 <<INDIVIDUAL_ATTRIBUTE_STRUCTURE>>
+1 <<LDS_INDIVIDUAL_ORDINANCE>>
+1 <<CHILD_TO_FAMILY_LINK>>
+1 <<SPOUSE_TO_FAMILY_LINK>>
+1 SUBM @<XREF:SUBM>@
+1 <<ASSOCIATION_STRUCTURE>>
+1 ALIA @<XREF:INDI>@
+1 ANCI @<XREF:SUBM>@
+1 DESI @<XREF:SUBM>@
+1 RFN <PERMANENT_RECORD_FILE_NUMBER>
+1 AFN <ANCESTRAL_FILE_NUMBER>
+1 REFN <USER_REFERENCE_NUMBER>
+2 TYPE <USER_REFERENCE_TYPE>

+1 RIN <AUTOMATED_RECORD_ID>
+1 <<CHANGE_DATE>>
+1 <<NOTE_STRUCTURE>>
+1 <<SOURCE_CITATION>>
+1 <<MULTIMEDIA_LINK>>

{1:1}
{0:1}
{0:M}
{0:1}
{0:M}
{0:M}
{0:M}
{0:M}
{0:M}
{0:M}
{0:M}
{0:M}
{0:M}
{0:M}
{0:1}
{0:1}
{0:M}
{0:1}
{0:1}
{0:1}
{0:M}
{0:M}
{0:M}

p.60
p.38
p.61
p.34
p.33
p.35, 36
p.31
p.40
p.28
p.31
p.25
p.28
p.28
p.57
p.42
p.63, 64
p.64
p.43
p.31
p.37
p.39
p.37, 26

The individual record is a compilation of facts, known or discovered, about an individual.  Sometimes
these facts are from different sources.  This form allows documentation of the source where each of

25

the facts were discovered.

The normal lineage links are shown through the use of pointers from the individual to a family
through either the FAMC tag or the FAMS tag.  The FAMC tag provides a pointer to a family where
this person is a child.  The FAMS tag provides a pointer to a family where this person is a spouse or
parent.  The <<CHILD_TO_FAMILY_LINK>> (see page 31) structure contains a FAMC pointer
which is required to show any child to parent linkage for pedigree navigation.  The
<<CHILD_TO_FAMILY_LINK>> structure also indicates whether the pedigree link represents a
birth lineage, an adoption lineage, or a sealing lineage.

Linkage between a child and the family they belonged to at the time of an event can also be shown
by a FAMC pointer subordinate to the appropriate event.  For example, a FAMC pointer subordinate
to an adoption event indicates a relationship to family by adoption. Biological parents can be shown
by a FAMC pointer subordinate to the birth event(optional).

Other associations or relationships are represented by the ASSOciation tag.  The person's relation
or association is the person being pointed to. The association or relationship is stated by the value
on the subordinate RELA line.   For example:

0 @I1@ INDI

1 NAME Fred/Jones/
1 ASSO @I2@

2 RELA Godfather

MULTIMEDIA_RECORD:=

n @XREF:OBJE@ OBJE

+1 FILE <MULTIMEDIA_FILE_REFN>

+2 FORM <MULTIMEDIA_FORMAT>
+3 TYPE <SOURCE_MEDIA_TYPE>

+2 TITL <DESCRIPTIVE_TITLE>

+1 REFN <USER_REFERENCE_NUMBER>
+2 TYPE <USER_REFERENCE_TYPE>

+1 RIN <AUTOMATED_RECORD_ID>
+1 <<NOTE_STRUCTURE>>
+1 <<SOURCE_CITATION>>
+1 <<CHANGE_DATE>>

{1:1}
{1:M}
{1:1}
{0:1}
{0:1}
{0:M}
{0:1}
{0:1}
{0:M}
{0:M}
{0:1}

p.54
p.54
p.62
p.48
p.63, 64
p.64
p.43
p.37
p.39
p.31

The BLOB context of the multimedia record was removed in version 5.5.1. A reference to a multimedia
file was added to the record structure.  The file reference occurs one to many times so that multiple files
can be grouped together, each pertaining to the same context. For example, if you wanted to associate a
sound clip and a photo, you would reference each multimedia file and indicate the format using the
FORM tag subordinate to each file reference.

26

NOTE_RECORD:=

n @<XREF:NOTE>@ NOTE <SUBMITTER_TEXT>

+1 [CONC|CONT] <SUBMITTER_TEXT>
+1 REFN <USER_REFERENCE_NUMBER>
+2 TYPE <USER_REFERENCE_TYPE>

+1 RIN <AUTOMATED_RECORD_ID>
+1 <<SOURCE_CITATION>>
+1 <<CHANGE_DATE>>

REPOSITORY_RECORD:=

n @<XREF:REPO>@ REPO

+1 NAME <NAME_OF_REPOSITORY>
+1 <<ADDRESS_STRUCTURE>>
+1 <<NOTE_STRUCTURE>>
+1 REFN <USER_REFERENCE_NUMBER>
+2 TYPE <USER_REFERENCE_TYPE>

+1 RIN <AUTOMATED_RECORD_ID>
+1 <<CHANGE_DATE>>

SOURCE_RECORD:=

n @<XREF:SOUR>@ SOUR

+1 DATA

+2 EVEN <EVENTS_RECORDED>
+3 DATE <DATE_PERIOD>
+3 PLAC <SOURCE_JURISDICTION_PLACE>

+2 AGNC <RESPONSIBLE_AGENCY>
+2 <<NOTE_STRUCTURE>>
+1 AUTH <SOURCE_ORIGINATOR>

+2 [CONC|CONT] <SOURCE_ORIGINATOR>

+1 TITL <SOURCE_DESCRIPTIVE_TITLE>

+2 [CONC|CONT] <SOURCE_DESCRIPTIVE_TITLE>

+1 ABBR <SOURCE_FILED_BY_ENTRY>
+1 PUBL <SOURCE_PUBLICATION_FACTS>

+2 [CONC|CONT] <SOURCE_PUBLICATION_FACTS>

+1 TEXT <TEXT_FROM_SOURCE>

+2 [CONC|CONT] <TEXT_FROM_SOURCE>

+1 <<SOURCE_REPOSITORY_CITATION>>
+1 REFN <USER_REFERENCE_NUMBER>
+2 TYPE <USER_REFERENCE_TYPE>

+1 RIN <AUTOMATED_RECORD_ID>

{1:1}
{0:M}
{0:M}
{0:1}
{0:1}
{0:M}
{0:1}

{1:1}
{1:1}
{0:1}
{0:M}
{0:M}
{0:1}
{0:1}
{0:1}

{1:1}
{0:1}
{0:M}
{0:1}
{0:1}
{0:1}
{0:M}
{0:1}
{0:M}
{0:1}
{0:M}
{0:1}
{0:1}
{0:M}
{0:1}
{0:M}
{0:M}
{0:M}
{0:1}
{0:1}

p.63

p.63, 64
p.64
p.43
p.39
p.31

p.54
p.31
p.37
p.63, 64
p.64
p.43
p.31

p.50
p.46
p.62
p.60
p.37
p.62
p.62
p.62
p.62
p.62
p.62
p.62
p.63
p.63
p.40
p.63, 64
p.64
p.43

27

+1 <<CHANGE_DATE>>
+1 <<NOTE_STRUCTURE>>
+1 <<MULTIMEDIA_LINK>>

{0:1}
{0:M}
{0:M}

p.31
p.37
p.37, 26

Source records are used to provide a bibliographic description of the source cited. (See the
<<SOURCE_CITATION>> structure, page 39, which contains the pointer to this source record.)

SUBMISSION_RECORD:=

n @XREF:SUBN@ SUBN

+1 SUBM @XREF:SUBM@
+1 FAMF <NAME_OF_FAMILY_FILE>
+1 TEMP <TEMPLE_CODE>
+1 ANCE <GENERATIONS_OF_ANCESTORS>
+1 DESC <GENERATIONS_OF_DESCENDANTS>
+1 ORDI <ORDINANCE_PROCESS_FLAG>
+1 RIN <AUTOMATED_RECORD_ID>
+1 <<NOTE_STRUCTURE>>
+1 <<CHANGE_DATE>>

{1:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:M}
{0:1}

p.28
p.54
p.63
p.50
p.50
p.57
p.43
p.37
p.31

The sending system uses a submission record to send instructions and information to the receiving
system. TempleReady processes submission records to determine which temple the cleared records
should be directed to. The submission record is also used for communication between Ancestral File
download requests and TempleReady. Each GEDCOM transmission file should have only one
submission record. Multiple submissions are handled by creating separate GEDCOM transmission
files.

SUBMITTER_RECORD:=

n @<XREF:SUBM>@ SUBM

+1 NAME <SUBMITTER_NAME>
+1 <<ADDRESS_STRUCTURE>>
+1 <<MULTIMEDIA_LINK>>
+1 LANG <LANGUAGE_PREFERENCE>
+1 RFN <SUBMITTER_REGISTERED_RFN>
+1 RIN <AUTOMATED_RECORD_ID>
+1 <<NOTE_STRUCTURE>>
+1 <<CHANGE_DATE>>

{1:1}
{1:1}
{0:1}*
{0:M}
{0:3}
{0:1}
{0:1}
{0:M}
{0:1}

p.63
p.31
p.37, 26
p.51
p.63
p.43
p.37
p.31

The submitter record identifies an individual or organization that contributed information contained
in the GEDCOM transmission. All records in the transmission are assumed to be submitted by the
SUBMITTER referenced in the HEADer, unless a SUBMitter reference inside a specific record
points at a different SUBMITTER record.

28

* Note: submissions to the ancestral file require the name and address of the submitter.

29

30

Substructures of the Lineage-Linked Form

ADDRESS_STRUCTURE:=

n ADDR <ADDRESS_LINE>

+1 CONT <ADDRESS_LINE>
+1 ADR1 <ADDRESS_LINE1>
+1 ADR2 <ADDRESS_LINE2>
+1 ADR3 <ADDRESS_LINE3>
+1 CITY <ADDRESS_CITY>
+1 STAE <ADDRESS_STATE>
+1 POST <ADDRESS_POSTAL_CODE>
+1 CTRY <ADDRESS_COUNTRY>

n PHON <PHONE_NUMBER>
n EMAIL <ADDRESS_EMAIL>
n FAX <ADDRESS_FAX>
n WWW <ADDRESS_WEB_PAGE>

{1:1}
{0:3}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:3}
{0:3}
{0:3}
{0:3}

p.41
p.41
p.41
p.41
p.41
p.41
p.42
p.41
p.41
p.57
p.41
p.41
p.42

The address structure should be formed as it would appear on a mailing label using the ADDR and
the CONT lines to form the address structure.  The ADDR and CONT lines are required for any
address. The additional subordinate address tags such as STAE and CTRY are provided to be used
by systems that have structured their addresses for indexing and sorting. For backward compatibility
these lines are not to be used in lieu of the required ADDR.and CONT line structure.

ASSOCIATION_STRUCTURE:=
n ASSO @<XREF:INDI>@

+1 RELA <RELATION_IS_DESCRIPTOR>
+1 <<SOURCE_CITATION>>
+1 <<NOTE_STRUCTURE>>

{1:1}
{1:1}
{0:M}
{0:M}

p.25
p.60
p.39
p.37

The association pointer only associates INDIvidual records to INDIvidual records.

CHANGE_DATE:=
n CHAN

+1 DATE <CHANGE_DATE>
+2 TIME <TIME_VALUE>
+1 <<NOTE_STRUCTURE>>

{1:1}
{1:1}
{0:1}
{0:M}

p.44
p.63
p.37

The change date is intended to only record the last change to a record.  Some systems may want to
manage the change process with more detail, but it is sufficient for GEDCOM purposes to indicate
the last time that a record was modified.

CHILD_TO_FAMILY_LINK:=
n FAMC @<XREF:FAM>@

{1:1}

p.24

31

+1 PEDI <PEDIGREE_LINKAGE_TYPE>
+1 STAT <CHILD_LINKAGE_STATUS>
+1 <<NOTE_STRUCTURE>>

{0:1}
{0:1}
{0:M}

p.57
p.44
p.37

EVENT_DETAIL:=

n TYPE <EVENT_OR_FACT_CLASSIFICATION>
n DATE <DATE_VALUE>
n <<PLACE_STRUCTURE>>
n <<ADDRESS_STRUCTURE>>
n AGNC <RESPONSIBLE_AGENCY>
n RELI <RELIGIOUS_AFFILIATION>
n CAUS <CAUSE_OF_EVENT>
n RESN <RESTRICTION_NOTICE>
n <<NOTE_STRUCTURE>>
n <<SOURCE_CITATION>>
n <<MULTIMEDIA_LINK>>

FAMILY_EVENT_DETAIL:=

n HUSB

+1 AGE <AGE_AT_EVENT>

n WIFE

+1 AGE <AGE_AT_EVENT>

n <<EVENT_DETAIL>>

FAMILY_EVENT_STRUCTURE:=

[
n [ ANUL | CENS | DIV | DIVF ] 

+1 <<FAMILY_EVENT_DETAIL>>

|
n [ ENGA | MARB | MARC ]

+1 <<FAMILY_EVENT_DETAIL>>

|
n  MARR  [Y|<NULL>]

+1 <<FAMILY_EVENT_DETAIL>>

|
n [ MARL | MARS ]

+1 <<FAMILY_EVENT_DETAIL>>

|
n RESI

+1 <<FAMILY_EVENT_DETAIL>>

|
n EVEN [<EVENT_DESCRIPTOR> | <NULL>] 

+1 <<FAMILY_EVENT_DETAIL>>

{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:M}
{0:M}
{0:M}

{0:1}
{1:1}
{0:1}
{1:1}
{0:1}

{1:1}
{0:1}

{1:1}
{0:1}

{1:1}
{0:1}

{1:1}
{0:1}

p.49
p.47, 46
p.38
p.31
p.60
p.60
p.43
p.60
p.37
p.39
p.37, 26

p.42

p.42
p.32

p.32

p.32

p.32

p.32

{0:1}

p.32

{1:1}
{0:1}

p.48
p.32

32

]

INDIVIDUAL_ATTRIBUTE_STRUCTURE:=

[
n CAST <CASTE_NAME> 

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n DSCR <PHYSICAL_DESCRIPTION> 

+1 [CONC | CONT ] <PHYSICAL_DESCRIPTION>
+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n EDUC <SCHOLASTIC_ACHIEVEMENT> 
+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n IDNO <NATIONAL_ID_NUMBER> 

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n NATI <NATIONAL_OR_TRIBAL_ORIGIN> 
+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n NCHI <COUNT_OF_CHILDREN> 

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n NMR <COUNT_OF_MARRIAGES> 

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n OCCU <OCCUPATION> 

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n PROP <POSSESSIONS> 

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n RELI <RELIGIOUS_AFFILIATION> 

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n RESI 

/* Resides at */

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n SSN <SOCIAL_SECURITY_NUMBER> 
+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n TITL <NOBILITY_TYPE_TITLE>

{1:1}
{0:1}*

p.43
p.34

{1:1}
{0:M}
{0:1}*

p.58
p.58
p.34

{1:1}
{0:1}*

p.61
p.34

{1:1}
{0:1}*

p.56
p.34

{1:1}
{0:1}*

p.56
p.34

{1:1}
{0:1}*

p.44
p.34

{1:1}
{0:1}*

p.44
p.34

{1:1}
{0:1}*

p.57
p.34

{1:1}
{0:1}*

p.59
p.34

{1:1}
{0:1}*

p.60
p.34

{1:1}
{0:1}*

p.34

{1:1}
{0:1}*

p.61
p.34

{1:1}

p.57

33

+1 <<INDIVIDUAL_EVENT_DETAIL>>

|
n FACT <ATTRIBUTE_DESCRIPTOR>

+1 <<INDIVIDUAL_EVENT_DETAIL>>

]

{0:1}*

p.34

{1:1}
{0:1}*

p.43
p.34

* Note: The usage of IDNO or the FACT tag require that a subordinate TYPE tag be used to define
what kind of identification number or fact classification is being defined.  The TYPE tag can be used
with each of the above tags used in this structure.

INDIVIDUAL_EVENT_DETAIL:=
n <<EVENT_DETAIL>>
n AGE <AGE_AT_EVENT>

INDIVIDUAL_EVENT_STRUCTURE:=

[
n [ BIRT | CHR ] [Y|<NULL>]

+1 <<INDIVIDUAL_EVENT_DETAIL>>
+1 FAMC @<XREF:FAM>@
|

n DEAT  [Y|<NULL>] 

+1 <<INDIVIDUAL_EVENT_DETAIL>>
|

n [ BURI | CREM ]  

+1 <<INDIVIDUAL_EVENT_DETAIL>>
|

n ADOP

+1 <<INDIVIDUAL_EVENT_DETAIL>>
+1 FAMC @<XREF:FAM>@

+2 ADOP <ADOPTED_BY_WHICH_PARENT>

|

n [ BAPM | BARM | BASM | BLES ]

+1 <<INDIVIDUAL_EVENT_DETAIL>>
|

n [ CHRA | CONF | FCOM | ORDN ]

+1 <<INDIVIDUAL_EVENT_DETAIL>>
|

n [ NATU | EMIG | IMMI ]

+1 <<INDIVIDUAL_EVENT_DETAIL>>
|

n [ CENS | PROB | WILL]

+1 <<INDIVIDUAL_EVENT_DETAIL>>
|

{1:1}
{0:1}

p.32
p.42

{1:1}
{0:1}*
{0:1}

{1:1}
{0:1}*

{1:1}
{0:1}*

{1:1}
{0:1}*
{0:1}
{0:1}

{1:1}
{0:1}*

{1:1}
{0:1}*

{1:1}
{0:1}*

{1:1}
{0:1}*

p.34
p.24

p.34

p.34

p.34
p.24
p.42

p.34

p.34

p.34

p.34

34

n[ GRAD | RETI ]

+1 <<INDIVIDUAL_EVENT_DETAIL>>
|
nEVEN

+1 <<INDIVIDUAL_EVENT_DETAIL>>
]

{1:1}
{0:1}*  p.34

{1:1} 
{0:1}*  p.34

As a general rule, events are things that happen on a specific date. Use the date form ‘BET date
AND date’  to indicate that an event took place at some time between two dates. Resist the
temptation to use a ‘FROM date TO date’  form in an event structure.  If the subject of your
recording occurred over a period of time, then it is probably not an event, but rather an attribute or
fact.

The EVEN tag in this structure is for recording general events that are not shown in the above
<<INDIVIDUAL_EVENT_STRUCTURE>>.  The event indicated by this general EVEN tag is
defined by the value of the subordinate TYPE tag. For example, a person that signed a lease for land
dated  October 2, 1837 and a lease for equipment dated November 4, 1837 would be written in
GEDCOM as::

1 EVEN 

2 TYPE Land Lease
2 DATE 2 OCT 1837

1 EVEN 

2 TYPE Equipment Lease
2 DATE 4 NOV 1837

The TYPE tag can be optionally used to modify the basic understanding of its superior event or
attribute.  For example:

1 GRAD

2 TYPE College  

The occurrence of an event is asserted by the presence of either a DATE tag and value or a PLACe
tag and value in the event structure. When neither the date value nor the place value are known then
a Y(es) value on the parent event tag line is required to assert that the event happened.  For example
each of the following GEDCOM structures assert that a death happened:

1 DEAT Y 
1 DEAT

2 DATE 2 OCT 1937

1 DEAT

2 PLAC Cove, Cache, Utah

35

Using this convention, as opposed to the just the presence of the tag, protects GEDCOM processors
which removes (prunes) lines which have neither a value nor any subordinate line.  It also allows a
note or source to be attached to an event context without implying that the event occurred.

It is not proper GEDCOM form to use a N(o) value with an event tag to infer that it did not happen. 
A convention to handle events which never happened may be defined in the future.   

LDS_INDIVIDUAL_ORDINANCE:=

[
n [ BAPL | CONL ]

+1 DATE <DATE_LDS_ORD>
+1 TEMP <TEMPLE_CODE>
+1 PLAC <PLACE_LIVING_ORDINANCE>
+1 STAT <LDS_BAPTISM_DATE_STATUS>

+2 DATE <CHANGE_DATE>

+1 <<NOTE_STRUCTURE>>
+1 <<SOURCE_CITATION>>

|
n ENDL

+1 DATE <DATE_LDS_ORD>
+1 TEMP <TEMPLE_CODE>
+1 PLAC <PLACE_LIVING_ORDINANCE>
+1 STAT <LDS_ENDOWMENT_DATE_STATUS>

+2 DATE <CHANGE_DATE>

+1 <<NOTE_STRUCTURE>>
+1 <<SOURCE_CITATION>>

|
n SLGC

+1 DATE <DATE_LDS_ORD>
+1 TEMP <TEMPLE_CODE>
+1 PLAC <PLACE_LIVING_ORDINANCE>
+1 FAMC @<XREF:FAM>@
+1 STAT <LDS_CHILD_SEALING_DATE_STATUS>

+2 DATE <CHANGE_DATE>

+1 <<NOTE_STRUCTURE>>
+1 <<SOURCE_CITATION>>

]

LDS_SPOUSE_SEALING:=

n SLGS

+1 DATE <DATE_LDS_ORD>
+1 TEMP <TEMPLE_CODE>
+1 PLAC <PLACE_LIVING_ORDINANCE>

{1:1}
{0:1}
{0:1}
{0:1}
{0:1}
{1:1}
{0:M}
{0:M}

{1:1}
{0:1}
{0:1}
{0:1}
{0:1}
{1:1}
{0:M}
{0:M}

{1:1}
{0:1}
{0:1}
{0:1}
{1:1}
{0:1}
{1:1}
{0:M}
{0:M}

{1:1}
{0:1}
{0:1}
{0:1}

p.46
p.63
p.58
p.51
p.44
p.37
p.39

p.46
p.63
p.58
p.52
p.44
p.37
p.39

p.46
p.63
p.58
p.24
p.51
p.44
p.37
p.39

p.46
p.63
p.58

36

+1 STAT <LDS_SPOUSE_SEALING_DATE_STATUS> 

+2 DATE <CHANGE_DATE> 

+1 <<NOTE_STRUCTURE>> 
+1 <<SOURCE_CITATION>> 

MULTIMEDIA_LINK:=

n OBJE @<XREF:OBJE>@ 
|
n OBJE

+1 FILE <MULTIMEDIA_FILE_REFN> 

+2 FORM <MULTIMEDIA_FORMAT> 

+3 MEDI  <SOURCE_MEDIA_TYPE> 

+1 TITL <DESCRIPTIVE_TITLE> 

p.52
{0:1} 
{1:1} 
p.44
{0:M}  p.37
{0:M}  p.39

{1:1} 

p.26

{1:M}  p.54
p.54
{1:1} 
p.62
{0:1} 
p.48
{0:1} 

Note: some systems may have output the following 5.5 structure. The new context above was
introduced in order to allow a grouping of related multimedia files to a particular context.

n OBJE

+1 FILE
+1 FORM <MULTIMEDIA_FORMAT>

+2 MEDI <SOURCE_MEDIA_TYPE>

NOTE_STRUCTURE:=

[
n NOTE @<XREF:NOTE>@ 
|
n NOTE [<SUBMITTER_TEXT> | <NULL>] 
+1 [CONC|CONT] <SUBMITTER_TEXT> 

]

{1:1} 

p.27

{1:1} 
{0:M}

p.63

Note: There are special considerations required when using the CONC tag. The usage is to provide a
note string that can be concatenated together so that the display program can do its own word
wrapping according to its display window size. The requirement for usage is to either break the text
line in the middle of a word, or if at the end of a word, to add a space to the first of the next CONC
line. Otherwise most operating systems will strip off the trailing space and the space is lost in the
reconstitution of the note. 

PERSONAL_NAME_PIECES:=

n NPFX <NAME_PIECE_PREFIX> 
n GIVN <NAME_PIECE_GIVEN> 
n NICK <NAME_PIECE_NICKNAME> 
n SPFX <NAME_PIECE_SURNAME_PREFIX 

{0:1} 
{0:1} 
{0:1} 
{0:1} 

p.55
p.55
p.55
p.56

37

 
n SURN <NAME_PIECE_SURNAME> 
n NSFX <NAME_PIECE_SUFFIX> 
n <<NOTE_STRUCTURE>> 
n <<SOURCE_CITATION>> 

PERSONAL_NAME_STRUCTURE:=
n NAME <NAME_PERSONAL> 
+1 TYPE <NAME_TYPE> 
+1 <<PERSONAL_NAME_PIECES>> 
+1 FONE <NAME_PHONETIC_VARIATION> 

+2 TYPE <PHONETIC_TYPE> 
+2 <<PERSONAL_NAME_PIECES>> 

+1 ROMN <NAME_ROMANIZED_VARIATION> 

+2 TYPE <ROMANIZED_TYPE> 
+2 <<PERSONAL_NAME_PIECES>> 

p.55
{0:1} 
{0:1} 
p.55
{0:M}  p.37
{0:M}  p.39

p.54
{1:1} 
p.56
{0:1} 
{0:1} 
p.37
{0:M}  p.55
p.57
{1:1} 
{0:1} 
p.37
{0:M}  p.56
p.61
{1:1} 
p.37
{0:1} 

The name value is formed in the manner the name is normally spoken, with the given name and family
name (surname) separated by slashes (/). (See <NAME_PERSONAL>, page 54.) Based on the
dynamic nature or unknown compositions of naming conventions, it is difficult to provide more
detailed name piece structure to handle every case. The NPFX, GIVN, NICK, SPFX, SURN, and
NSFX tags are provided optionally for systems that cannot operate effectively with less structured
information.  For current future compatibility, all systems must construct their names based on the
<NAME_PERSONAL> structure. Those using the optional name pieces should assume that few
systems will process them, and most will not provide the name pieces.

A <NAME_TYPE> is used to specify the particular variation that this name is.  For example; if the
name type is subordinate to the <NAME_PERSONAL> it could indicate that this name is a name
taken at immigration or that it could be an ‘also known as’ name (see  page 56.)

Future GEDCOM releases (6.0 or later) will likely apply a very different strategy to resolve this
problem, possibly using a sophisticated parser and a name-knowledge database.

PLACE_STRUCTURE:=

n PLAC <PLACE_NAME> 

+1 FORM <PLACE_HIERARCHY> 

{1:1} 
{0:1} 

p.58
p.58

38

+1 FONE <PLACE_PHONETIC_VARIATION>

+2 TYPE <PHONETIC_TYPE>

+1 ROMN <PLACE_ROMANIZED_VARIATION>

+2 TYPE <ROMANIZED_TYPE>

+1 MAP

+2 LATI <PLACE_LATITUDE>
+2 LONG <PLACE_LONGITUDE>

+1 <<NOTE_STRUCTURE>>

SOURCE_CITATION:=

[
n SOUR @<XREF:SOUR>@   

/* pointer to source record (preferred)*/

+1 PAGE <WHERE_WITHIN_SOURCE>
+1 EVEN <EVENT_TYPE_CITED_FROM>

+2 ROLE <ROLE_IN_EVENT>

+1 DATA

+2 DATE <ENTRY_RECORDING_DATE>
+2 TEXT <TEXT_FROM_SOURCE>

+3 [CONC|CONT] <TEXT_FROM_SOURCE>

+1 <<MULTIMEDIA_LINK>>
+1 <<NOTE_STRUCTURE>>
+1 QUAY <CERTAINTY_ASSESSMENT>

|
n SOUR <SOURCE_DESCRIPTION>

/* Systems not using source records */

+1 [CONC|CONT] <SOURCE_DESCRIPTION>
+1 TEXT <TEXT_FROM_SOURCE>

+2 [CONC|CONT] <TEXT_FROM_SOURCE>

+1 <<MULTIMEDIA_LINK>>
+1 <<NOTE_STRUCTURE>>
+1 QUAY <CERTAINTY_ASSESSMENT>

]

{0:M}
{1:1}
{0:M}
{1:1}
{0:1}
{1:1}
{1:1}
{0:M}

{1:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:1}
{0:M}
{0:M}
{0:M}
{0:M}
{0:1}

{1:1}
{0:M}
{0:M}
{0:M}
{0:M}
{0:M}
{0:1}

p.59
p.57
p.59
p.61

p.58
p.58
p.37

p.27
p.64
p.49
p.61

p.48
p.63

p.37, 26
p.37
p.43

p.61

p.63

p.37, 26
p.37
p.43

The data provided in the <<SOURCE_CITATION>> structure is source-related information specific
to the data being cited. (See GEDCOM examples starting on page 74.) Systems that do not use a
(SOURCE_RECORD)  must use the non-preferred second SOURce citation structure option.  When
systems that support the zero level source record format encounters a source citation that does not
contain pointers to source records, then that system needs to create a SOURCE_RECORD format
and store the source description information found in the non-structured source citation in the title
area for the new source record.

The information intended to be placed in the citation structure includes:
! The pointer to the SOURCE_RECORD, which contains a more general description of the source

39

used for the fact being cited.

! Information, such as a page number, to help the user find the cited data within the referenced

source. This is stored in the “.SOUR.PAGE”  tag context.

! Actual text from the source that was used in making assertions, for example a date phrase as
actually recorded in the source, or significant notes written by the recorder, or an applicable
sentence from a letter. This is stored in the “.SOUR.DATA.TEXT”  tag context.

! Data that allows an assessment of the relative value of one source over another for making the

recorded assertions (primary or secondary source, etc.).  Data needed for this assessment is data
that would help determine  how much time from the date of the asserted fact and when the source
was actually recorded, what type of event was cited, and what type of role did this person have in
the cited source.

- Date when the entry was recorded in source document is stored in the

".SOUR.DATA.DATE" tag context.

- The type of event that initiated the recording is stored in the “SOUR.EVEN”  tag context. The

value used is the event code taken from the table of choices shown in the
EVENT_TYPE_CITED_FROM primitive on page 49

- The role of this person in the event is stored in the ".SOUR.EVEN.ROLE" context.

SOURCE_REPOSITORY_CITATION:=

n REPO [ @XREF:REPO@ | <NULL>]

+1 <<NOTE_STRUCTURE>>
+1 CALN <SOURCE_CALL_NUMBER>
+2 MEDI <SOURCE_MEDIA_TYPE>

{1:1}
{0:M}
{0:M}
{0:1}

p.27
p.37
p.61
p.62

This structure is used within a source record to point to a name and address record of the holder of the
source document.  Formal and informal repository name and addresses are stored in the
REPOSITORY_RECORD.  Informal repositories include owner's of an unpublished work or of a rare
published source, or a keeper of personal collections. An example would be the owner of a family Bible
containing unpublished family genealogical entries. More formal repositories, such as the Family History
Library, should show a call number of the source at that repository. The call number of that source
should be recorded using a subordinate CALN tag.  Systems which do not use repository name and
address record, should describe where the information cited is stored in the <<NOTE_STRUCTURE>>
of the REPOsitory source citation structure.

SPOUSE_TO_FAMILY_LINK:=
n FAMS @<XREF:FAM>@

+1 <<NOTE_STRUCTURE>>

{1:1}
{0:M}

p.24
p.37

40

Primitive Elements of the Lineage-Linked Form

The field sizes show the minimum recommended field length within a database that is constrained to fixed
length fields. The field sizes are in addition to the GEDCOM level and tag overhead. GEDCOM lines are
limited to 255 characters. However, the CONCatenation or CONTinuation tags can be used to expand a
field beyond this limit. CONT line implies that a new line should appear to preserve formatting.  CONC
implies concatenation to the previous line without a new line.  This is used so that a text note or
description can be processed (word wrapped) in a text window without fixed carriage returns.  The
CONT and CONC tags are being used to extend specified textual values.

ADDRESS_CITY:=

The name of the city used in the address. Isolated for sorting or indexing.

ADDRESS_COUNTRY:=

{Size=1:60}

{Size=1:60}

The name of the country that pertains to the associated address. Isolated by some systems for sorting
or indexing. Used in most cases to facilitate automatic sorting of mail.

ADDRESS_EMAIL:=

An electronic address that can be used for contact such as an email address.

ADDRESS_FAX:=

A FAX telephone number appropriate for sending data facsimiles.

ADDRESS_LINE:=

{Size=5:120}

{Size=5:60}

{Size=1:60}

Typically used to define a mailing address of an individual when used subordinate to a RESIdent tag.
When it is used subordinate to an event tag it is the address of the place where the event took place.
The address lines usually contain the addressee’s name and other street and city information so that it 
forms an address that meets mailing requirements.

ADDRESS_LINE1:=

{Size=1:60}

The first line of the address used for indexing.  This is the value of the line corresponding to the
ADDR tag line in the address structure.

ADDRESS_LINE2:=

{Size=1:60}

The second line of the address used for indexing.  This is the value of the first CONT line subordinate
to the ADDR tag in the address structure.

ADDRESS_LINE3:=

{Size=1:60}

The third line of the address used for indexing.  This is the value of the second CONT line subordinate
to the ADDR tag in the address structure.

ADDRESS_POSTAL_CODE:=

{Size=1:10}

The ZIP or postal code used by the various localities in handling of mail.  Isolated for sorting or

41

indexing.

ADDRESS_STATE:=

The name of the state used in the address. Isolated for sorting or indexing.

ADDRESS_WEB_PAGE:=

The world wide web page address.

ADOPTED_BY_WHICH_PARENT:=

{Size=1:60}

{Size=5:120}

{Size=1:4}

[ HUSB | WIFE | BOTH ]
A code which shows which parent in the associated family record adopted this person.
Where:
HUSB
WIFE
BOTH

= The WIFE in the associated family adopted this person.
= Both HUSBand and WIFE adopted this person.

= The HUSBand in the associated family adopted this person.

{Size=1:12}

AGE_AT_EVENT:=
[ < | > | <NULL>]
[ YYy MMm DDDd | YYy | MMm | DDDd |
  YYy MMm | YYy DDDd | MMm DDDd |
  CHILD | INFANT | STILLBORN ]
]
Where:
>
<
y
m
d
YY
MM
DDD
CHILD
INFANT
STILLBORN = died just prior, at, or near birth, 0 years

= greater than indicated age
= less than indicated age
= a label indicating years
= a label indicating months
= a label indicating days
= number of full years
= number of months
= number of days
= age < 8 years
= age < 1 year

A number that indicates the age in years, months, and days that the principal was at the time of the
associated event. Any labels must come after their corresponding number, for example; 4y 8m 10d.

ANCESTRAL_FILE_NUMBER:=

{Size=1:12}

A unique permanent record number of an individual record contained in the Family History
Department's Ancestral File.

APPROVED_SYSTEM_ID:=

{Size=1:20}

42

A system identification name which was obtained through the GEDCOM registration process. This
name must be unique from any other product. Spaces within the name must be substituted with a 0x5F
(underscore _) so as to create one word.

ATTRIBUTE_DESCRIPTOR:=

{Size=1:90}

Text describing a particular characteristic or attribute assigned to an individual. This attribute value is
assigned to the FACT tag.  The classification of this specific attribute or fact is specified by the value
of the subordinate TYPE tag selected from the EVENT_DETAIL structure.  For example if you were
classifying the skills a person had obtained; 

1 FACT Woodworking

2 TYPE Skills

ATTRIBUTE_TYPE:=

{Size=1:4}

[ CAST | EDUC | NATI | OCCU | PROP | RELI | RESI | TITL | FACT ]
An attribute which may have caused name, addresses, phone numbers, family listings to be recorded. 
Its application is in helping to classify sources used for information.

AUTOMATED_RECORD_ID:=

{Size=1:12}

A unique record identification number assigned to the record by the source system.  This number is
intended to serve as a more sure means of identification of a record for reconciling differences in data
between two interfacing systems.

CASTE_NAME:=

{Size=1:90}

A name assigned to a particular group that this person was associated with, such as a particular racial
group, religious group, or a group with an inherited status.

CAUSE_OF_EVENT:=

{Size=1:90}

Used in special cases to record the reasons which precipitated an event. Normally this will be used
subordinate to a death event to show cause of death, such as might be listed on a death certificate.

CERTAINTY_ASSESSMENT:=

{Size=1:1}

[ 0 | 1 | 2 | 3 ]
The QUAY tag's value conveys the submitter's quantitative evaluation of the credibility of a piece of
information, based upon its supporting evidence. Some systems use this feature to rank multiple
conflicting opinions for display of most likely information first. It is not intended to eliminate the
receiver's need to evaluate the evidence for themselves.

0 = Unreliable evidence or estimated data
1 = Questionable reliability of evidence (interviews, census, oral genealogies, or potential for bias

for example, an autobiography)

2 = Secondary evidence, data officially recorded sometime after event
3 = Direct and primary evidence used, or by dominance of the evidence

43

CHANGE_DATE:=
<DATE_EXACT>
The date that this data was changed.

CHARACTER_SET:=

{Size=10:11}

{Size=1:8}

[ ANSEL |UTF-8 | UNICODE | ASCII ]
A code value that represents the character set to be used to interpret this data. Currently, the 
preferred character set is ANSEL, which includes ASCII as a subset. UNICODE is not widely
supported by most operating systems; therefore, GEDCOM produced using the UNICODE character
set will be limited in its interchangeability for a while but should eventually provide the international
flexibility that is desired. See Chapter 3, starting on page 77.

Note:The IBMPC character set is not allowed. This character set cannot be interpreted properly
without knowing which code page the sender was using.

CHILD_LINKAGE_STATUS:=
[challenged | disproven | proven]
A status code that allows passing on the users opinion of the status of a child to family link.
challenged = Linking this child to this family is suspect, but the linkage has been neither proven nor

{Size=1:15}

disproven.

disproven  = There has been a claim by some that this child belongs to this family, but the linkage

has been disproven.

proven

= There has been a claim by some that this child does not belongs to this family, but the

linkage has been proven.

COPYRIGHT_GEDCOM_FILE:=

{Size=1:90}
A copyright statement needed to protect the copyrights of the submitter of this GEDCOM file.

COPYRIGHT_SOURCE_DATA:=

{Size=1:90}

A copyright statement required by the owner of data from which this information was down- loaded. 
For example, when a GEDCOM down-load is requested from the Ancestral File, this would be the
copyright statement to indicate that the data came from a copyrighted source.

COUNT_OF_CHILDREN:=

{Size=1:3}

The known number of children of this individual from all marriages or, if subordinate to a family
record, the reported number of children known to belong to this family, regardless of whether the
associated children are represented in the corresponding structure. This is not necessarily the count of
children listed in a family structure.

COUNT_OF_MARRIAGES:=

{Size=1:3}

The number of different families that this person was known to have been a member of as a spouse or
parent, regardless of whether the associated families are represented in the GEDCOM file.

44

DATE:=

[ <DATE_CALENDAR_ESCAPE> | <NULL>]
<DATE_CALENDAR>

DATE_APPROXIMATED:=

{Size=4:35}

{Size=4:35}

[
ABT <DATE> |
CAL <DATE> |
EST <DATE>
]
Where:
ABT = About, meaning the date is not exact.
CAL = Calculated mathematically, for example, from an event date and age.
EST = Estimated based on an algorithm using some other event date.

DATE_CALENDAR:=

{Size=4:35}

[ <DATE_GREG> | <DATE_JULN> | <DATE_HEBR> | <DATE_FREN> |
  <DATE_FUTURE> ]
The selection is based on the <DATE_CALENDAR_ESCAPE> that precedes the
<DATE_CALENDAR> value immediately to the left.  If <DATE_CALENDAR_ESCAPE> doesn't
appear at this point, then @#DGREGORIAN@ is assumed.  No future calendar types will use words
(e.g., month names) from this list: FROM, TO, BEF, AFT, BET, AND, ABT, EST, CAL, or INT. 
When only a day and month appears as a DATE value it is considered a date phrase and not a valid
date form.

Date Escape

Syntax Selected

    @#DGREGORIAN@ <DATE_GREG>
<DATE_JULN>
    @#DJULIAN@
<DATE_HEBR>
    @#DHEBREW@
<DATE_FREN>
    @#DFRENCH R@
for future definition
    @#DROMAN@
calendar not known
    @#DUNKNOWN@ 

DATE_CALENDAR_ESCAPE:=

{Size=4:15}   

[ @#DHEBREW@ | @#DROMAN@ | @#DFRENCH R@ | @#DGREGORIAN@ |
  @#DJULIAN@ | @#DUNKNOWN@ ]
The date escape determines the date interpretation by signifying which <DATE_CALENDAR> to use.
The default calendar is the Gregorian calendar.

DATE_EXACT:=

<DAY> <MONTH> <YEAR_GREG>

DATE_FREN:=

[ <YEAR>[B.C.] | <MONTH_FREN> <YEAR> |

{Size=10:11}

{Size=4:35}

45

 <DAY> <MONTH_FREN> <YEAR> ]

See <MONTH_FREN> page 53

DATE_GREG:=

[ <YEAR_GREG>[B.C.] | <MONTH> <YEAR_GREG> |
  <DAY> <MONTH> <YEAR_GREG> ]

See <YEAR_GREG> page 65.

DATE_HEBR:=

[ <YEAR>[B.C.] | <MONTH_HEBR> <YEAR> |
  <DAY> <MONTH_HEBR> <YEAR> ]

See <MONTH_HEBR> page 53

{Size=4:35}

{Size=4:35}

DATE_JULN:=

[ <YEAR>[B.C.] | <MONTH> <YEAR> | <DAY> <MONTH> <YEAR> ]

{Size=4:35}

{Size=4:35}

DATE_LDS_ORD:=
<DATE_VALUE>
LDS ordinance dates use only the Gregorian date and most often use the form of day, month, and
year. Only in rare instances is there a partial date. The temple tag and code should always accompany
temple ordinance dates. Sometimes the LDS_(ordinance)_DATE_STATUS is used to indicate that an
ordinance date and temple code is not required, such as when BIC is used. (See
LDS_(ordinance)_DATE_STATUS definitions beginning on page 51.)

DATE_PERIOD:=

{Size=7:35}

[
FROM <DATE> |
TO <DATE> |
FROM <DATE> TO <DATE>
]
Where:
FROM = Indicates the beginning of a happening or state.
TO

= Indicates the ending of a happening or state.

Examples:
FROM 1904 to 1915

= The state of some attribute existed from 1904 to 1915 inclusive.

FROM 1904

= The state of the attribute began in 1904 but the end date is unknown.

TO 1915

= The state ended in 1915 but the begin date is unknown.

46

DATE_PHRASE:=

{Size=1:35}

<TEXT>
Any statement offered as a date when the year is not recognizable to a date parser, but which gives
information about when an event occurred.

DATE_RANGE:=

[
BEF <DATE> |
AFT <DATE> |
BET <DATE> AND <DATE>
]

{Size=8:35}

Where:
AFT = Event happened after the given date.
BEF = Event happened before the given date.
BET = Event happened some time between date 1 AND date 2. For example, bet 1904 and 1915
indicates that the event state (perhaps a single day) existed somewhere between 1904 and
1915 inclusive.

The date range differs from the date period in that the date range is an estimate that an event happened
on a single date somewhere in the date range specified.

The following are equivalent and interchangeable:

Short form
1852
1852
1852
1852
JAN 1920

Long Form
BET 1 JAN 1852 AND 31 DEC 1852
BET 1 JAN 1852 AND DEC 1852
BET JAN 1852 AND 31 DEC 1852
BET JAN 1852 AND DEC 1852
BET 1 JAN 1920 AND 31 JAN 1920

DATE_VALUE:=

[
<DATE> |
<DATE_PERIOD> |
<DATE_RANGE>|
<DATE_APPROXIMATED> |
INT <DATE> (<DATE_PHRASE>) |
(<DATE_PHRASE>)
]

{Size=1:35}

The DATE_VALUE represents the date of an activity, attribute, or event where:

INT = Interpreted from knowledge about the associated date phrase included in parentheses. 

47

An acceptable alternative to the date phrase choice is to use one of the other choices such as
<DATE_APPROXIMATED> choice as the DATE line value and then include the date phrase value
as a NOTE value subordinate to the DATE line tag.

The date value can take on the date form of just a date, an approximated date, between a date and
another date, and from one date to another date.  The preferred form of showing date imprecision, is
to show, for example, MAY 1890 rather than ABT 12 MAY 1890.  This is because limits have not
been assigned to the precision of the prefixes such as ABT or EST.  

DAY:=
dd
Day of the month, where dd is a numeric digit whose value is within the valid range of the days for the
associated calendar month.

{Size=1:2}

DESCRIPTIVE_TITLE:=

The title of a work, record, item, or object.

DIGIT:=

A single digit (0-9).

ENTRY_RECORDING_DATE:=

<DATE_VALUE>
The date that this event data was entered into the original source document.

EVENT_ATTRIBUTE_TYPE:=

{Size=1:248}  

{Size=1:1}

{Size=1:90}

{Size=1:15}

[ <EVENT_TYPE_INDIVIDUAL> |
 <EVENT_TYPE_FAMILY> |
 <ATTRIBUTE_TYPE> ]
A code that classifies the principal event or happening that caused the source record entry to be
created.  If the event or attribute doesn't translate to one of these tag codes, then a user supplied value
is expected and will be generally classified in the category of other.

EVENT_DESCRIPTOR:=

{Size=1:90}

Text describing a particular event pertaining to the individual or family. This event value is usually
assigned to the EVEN tag.  The classification as to the difference between this specific event and other
occurrences of the EVENt tag is indicated by the use of a subordinate TYPE tag selected from the
EVENT_DETAIL structure.  For example; 

1 EVEN Appointed Zoning Committee Chairperson

2 TYPE Civic Appointments
2 DATE FROM JAN 1952 TO JAN 1956
2 PLAC Cove, Cache, Utah
2 AGNC Cove City Redevelopment

48

EVENT_OR_FACT_CLASSIFICATION:=

{Size=1:90}

A descriptive word or phrase used to further classify the parent event or attribute tag. This should be
used whenever either of  the generic EVEN or FACT tags are used. The value of this primative is
responsible for classifying the generic event or fact being cited. For example, if the attribute being
defined was one of the persons skills, such as woodworking, the FACT tag would have the value of
`Woodworking', followed by a subordinate TYPE tag with the value `Skills.'

1 FACT Woodworking

2 TYPE Skills

This groups the fact into a generic skills attribute, and in particular this entry records the fact that this
individual possessed the skill of woodworking. Using the subordinate TYPE tag classification method
with any of the other defined event tags provides a further classification of the parent tag but does not
change the basic meaning of the parent tag. For example, a MARR tag could be subordinated with a
TYPE tag with an EVENT_DESCRIPTOR value of `Common Law.' 

1 MARR

2 TYPE Common Law

This classifies the entry as a common law marriage but the event is still a marriage event. Other
descriptor values might include, for example,`stillborn' as a qualifier to BIRTh or `Tribal Custom' as a
qualifier to MARRiage.

EVENT_TYPE_CITED_FROM:=

{SIZE=1:15}

[ <EVENT_ATTRIBUTE_TYPE> ]
A code that indicates the type of event which was responsible for the source entry being recorded. For
example, if the entry was created to record a birth of a child, then the type would be BIRT regardless
of the assertions made from that record, such as the mother's name or mother's birth date. This will
allow a prioritized best view choice and a determination of the certainty associated with the source
used in asserting the cited fact.

EVENT_TYPE_FAMILY:=

[ ANUL | CENS | DIV | DIVF | ENGA | MARR |
 MARB | MARC | MARL | MARS | EVEN ]

{Size=3:4}

A code used to indicate the type of family event.  The definition is the same as the corresponding
event tag defined in Appendix A. (See Appendix A, starting on page 83).

EVENT_TYPE_INDIVIDUAL:=

[ ADOP | BIRT | BAPM | BARM | BASM |
 BLES | BURI | CENS | CHR | CHRA |
 CONF | CREM | DEAT | EMIG | FCOM |
 GRAD | IMMI | NATU | ORDN |
 RETI | PROB | WILL | EVEN ]

{Size=3:4}

49

A code used to indicate the type of family event.  The definition is the same as the corresponding
event tag defined in Appendix A. (See Appendix A, starting on page 83).

EVENTS_RECORDED:=

{Size=1:90}

[<EVENT_ATTRIBUTE_TYPE> |
 <EVENTS_RECORDED>, <EVENT_ATTRIBUTE_TYPE>]
An enumeration of the different kinds of events that were recorded in a particular source. Each
enumeration is separated by a comma. Such as a parish register of births, deaths, and marriages would
be BIRT, DEAT, MARR.

FILE_NAME:=

{Size=1:90}

The name of the GEDCOM transmission file. If the file name includes a file extension it must be
shown in the form (filename.ext).

GEDCOM_CONTENT_DESCRIPTION:=

{Size=1:248}

A note that a user enters to describe the contents of the lineage-linked file in terms of "ancestors or
descendants of" so that the person receiving the data knows what genealogical information the
transmission contains.

GEDCOM_FORM:=

{Size=14:20}

[ LINEAGE-LINKED ]
The GEDCOM form used to construct this transmission. There maybe other forms used such as
CommSoft's "EVENT_LINEAGE_LINKED" but these specifications define only the LINEAGE-
LINKED Form.  Systems will use this value to specify GEDCOM compatible with these
specifications.

GENERATIONS_OF_ANCESTORS:=

{Size=1:4}

The number of generations of ancestors included in this transmission. This value is usually provided
when FamilySearch programs build a GEDCOM file for a patron requesting a download of ancestors.

GENERATIONS_OF_DESCENDANTS:=

{Size=1:4}

The number of generations of descendants included in this transmission. This value is usually provided
when FamilySearch programs build a GEDCOM file for a patron requesting a download of
descendants.

LANGUAGE_ID:=

{Size=1:15}

A table of valid latin language identification codes.
[ Afrikaans | Albanian | Anglo-Saxon | Catalan | Catalan_Spn | Czech | Danish | Dutch | English |
Esperanto | Estonian | Faroese | Finnish | French | German | Hawaiian | Hungarian | Icelandic |
Indonesian | Italian | Latvian | Lithuanian | Navaho | Norwegian | Polish | Portuguese | Romanian |
Serbo_Croa | Slovak | Slovene | Spanish | Swedish | Turkish | Wendic ]

Other languages not supported until UNICODE

50

[ Amharic | Arabic | Armenian | Assamese | Belorusian | Bengali | Braj | Bulgarian | Burmese |
Cantonese | Church-Slavic | Dogri | Georgian | Greek | Gujarati | Hebrew | Hindi | Japanese |
Kannada | Khmer | Konkani | Korean | Lahnda | Lao | Macedonian | Maithili | Malayalam | Mandrin |
Manipuri | Marathi | Mewari | Nepali | Oriya | Pahari | Pali | Panjabi | Persian | Prakrit | Pusto |
Rajasthani | Russian | Sanskrit | Serb | Tagalog | Tamil | Telugu | Thai | Tibetan | Ukrainian | Urdu |
Vietnamese | Yiddish ]

LANGUAGE_OF_TEXT:=
[ <LANGUAGE_ID> ]
The human language in which the data in the transmission is normally read or written.  It is used
primarily by programs to select language-specific sorting sequences and phonetic name matching
algorithms.

{Size=1:15}

LANGUAGE_PREFERENCE:=

[ <LANGUAGE_ID> ]

{Size=1:90}

The language in which a person prefers to communicate.  Multiple language preference is shown by
using multiple occurrences in order of priority.

LDS_BAPTISM_DATE_STATUS:=

[ CHILD | COMPLETED | EXCLUDED | PRE-1970 |
  STILLBORN | SUBMITTED | UNCLEARED ]

{Size=5:10}

A code indicating the status of an LDS baptism and confirmation date where:

CHILD
COMPLETED
EXCLUDED
PRE-1970

= Died before becoming eight years old, baptism not required.
= Completed but the date is not known.
= Patron excluded this ordinance from being cleared in this submission.
= Ordinance is likely completed, another ordinance for this person was converted
from temple records of work completed before 1970, therefore this ordinance is
assumed to be complete until all records are converted.

STILLBORN
SUBMITTED
UNCLEARED

= Stillborn, baptism not required.
= Ordinance was previously submitted.
= Data for clearing ordinance request was insufficient.

LDS_CHILD_SEALING_DATE_STATUS:=

[ BIC | COMPLETED | EXCLUDED | DNS | PRE-1970 |
  STILLBORN | SUBMITTED | UNCLEARED ]

{Size=5:10}

BIC
EXCLUDED
PRE-1970
STILLBORN

= Born in the covenant receiving blessing of child to parent sealing.
= Patron excluded this ordinance from being cleared in this submission.
= (See pre-1970 under LDS_BAPTISM_DATE_STATUS on page 51.)
= Stillborn, not required.

51

SUBMITTED
UNCLEARED = Data for clearing ordinance request was insufficient.

= Ordinance was previously submitted.

LDS_ENDOWMENT_DATE_STATUS:=

[ CHILD | COMPLETED | EXCLUDED | PRE-1970 |
  STILLBORN | SUBMITTED | UNCLEARED ]

{Size=5:10}

A code indicating the status of an LDS endowment ordinance where:

= Died before eight years old.

= Patron excluded this ordinance from being cleared in this submission.
= Died before less than one year old, baptism or endowment not required.

CHILD
COMPLETED = Completed but the date is not known.
EXCLUDED
INFANT
PRE-1970
STILLBORN
SUBMITTED
UNCLEARED = Data for clearing ordinance request was insufficient.

= (See pre-1970 under LDS_BAPTISM_DATE_STATUS on page 51.)
= Stillborn, ordinance not required.
= Ordinance was previously submitted.

LDS_SPOUSE_SEALING_DATE_STATUS:=

[ CANCELED | COMPLETED | DNS | EXCLUDED |
  DNS/CAN | PRE-1970 | SUBMITTED | UNCLEARED ]

{Size=3:10}

= Canceled and considered invalid.

CANCELED
COMPLETED = Completed but the date is not known.
EXCLUDED
DNS
DNS/CAN
PRE-1970
SUBMITTED
UNCLEARED = Data for clearing ordinance request was insufficient.

= Patron excluded this ordinance from being cleared in this submission.
= This ordinance is not authorized.
= This ordinance is not authorized, previous sealing cancelled.
= (See pre-1970 under LDS_BAPTISM_DATE_STATUS on page 51.)
= Ordinance was previously submitted.

MONTH:=

{Size=3}

[ JAN | FEB | MAR | APR | MAY | JUN |
  JUL | AUG | SEP | OCT | NOV | DEC ]
Where:
= January
JAN
= February
FEB
= March
MAR
APR
= April
MAY = May
= June
JUN
= July
JUL
= August
AUG

52

SEP
OCT
NOV
DEC

= September
= October
= November
= December

MONTH_FREN:=

[ VEND | BRUM | FRIM | NIVO | PLUV | VENT | GERM |
  FLOR | PRAI | MESS | THER | FRUC | COMP ]

{Size=4}

Where:
VEND
BRUM
FRIM
NIVO
PLUV
VENT
GERM
FLOR
PRAI
MESS
THER
FRUC
COMP

= VENDEMIAIRE
= BRUMAIRE
= FRIMAIRE
= NIVOSE
= PLUVIOSE
= VENTOSE
= GERMINAL
= FLOREAL
= PRAIRIAL
= MESSIDOR
= THERMIDOR
= FRUCTIDOR
= JOUR_COMPLEMENTAIRS

MONTH_HEBR:=

[ TSH | CSH | KSL | TVT | SHV | ADR | ADS |
  NSN | IYR | SVN | TMZ | AAV | ELL ]

{Size=3}

Where:
TSH
CSH
KSL
TVT
SHV
ADR
ADS
NSN
IYR
SVN
TMZ
AAV
ELL

= Tishri
= Cheshvan
= Kislev
= Tevet
= Shevat
= Adar
= Adar Sheni
= Nisan
= Iyar
= Sivan
= Tammuz
= Av
= Elul

53

MULTIMEDIA_FILE_REFERENCE:=

{Size=1:30}

A complete local or remote file reference to the auxiliary data to be linked to the GEDCOM context. 
Remote reference would include a network address where the multimedia data may be obtained.

MULTIMEDIA_FORMAT:=

{Size=3:4}

[ bmp | gif | jpg | ole | pcx | tif | wav ]
Indicates the format of the multimedia data associated with the specific GEDCOM context. This
allows processors to determine whether they can process the data object. Any linked files should
contain the data required, in the indicated format, to process the file data.

NAME_OF_BUSINESS:=

{Size=1:90}

Name of the business, corporation, or person that produced or commissioned the product.

NAME_OF_FAMILY_FILE:=

{Size=1:120}

Name under which family names for ordinances are stored in the temple's family file.

NAME_OF_PRODUCT:=

The name of the software product that produced this transmission.

NAME_OF_REPOSITORY:=

The official name of the archive in which the stated source material is stored.

NAME_OF_SOURCE_DATA:=

{Size=1:90}

{Size=1:90}

{Size=1:90}

The name of the electronic data source that was used to obtain the data in this transmission. For
example, the data may have been obtained from a CD-ROM disc that was named "U.S. 1880
CENSUS CD-ROM vol. 13."

NAME_PERSONAL:=

{Size=1:120}

[
 <NAME_TEXT> |
/<NAME_TEXT>/ |
 <NAME_TEXT> /<NAME_TEXT>/ |
/<NAME_TEXT>/ <NAME_TEXT> |
 <NAME_TEXT> /<NAME_TEXT>/ <NAME_TEXT>
]
The surname of an individual, if known, is enclosed between two slash (/) characters. The order of the
name parts should be the order that the person would, by custom of their culture, have used when
giving it to a recorder. Early versions of Personal Ancestral File ® and other products did not use the
trailing slash when the surname was the last element of the name. If part of name is illegible, that part
is indicated by an ellipsis (...). Capitalize the name of a person or place in the conventional
manner—capitalize the first letter of each part and lowercase the other letters, unless conventional
usage is otherwise. For example: McMurray. 

54

Examples:
William Lee (given name only or surname not known)
/Parry/ (surname only)
William Lee /Parry/
William Lee /Mac Parry/ (both parts (Mac and Parry) are surname parts
William /Lee/ Parry (surname imbedded in the name string)
William Lee /Pa.../

NAME_PHONETIC_VARIATION:=

{Size=1:120}
The phonetic variation of the name is written in the same form as the was the name used in the
superior <NAME_PERSONAL> primitive, but phonetically written using the method indicated by the
subordinate <PHONETIC_TYPE> value, for example if hiragana was used to provide a reading of a
name written in kanji, then the <PHONETIC_TYPE> value would indicate ‘kana’. See page 57.

NAME_PIECE:=  

{Size=1:90}

The piece of the name pertaining to the name part of interest. The surname part, the given name part,
the name prefix part, or the name suffix part.

NAME_PIECE_GIVEN:= {Size=1:120}

[ <NAME_PIECE> | <NAME_PIECE_GIVEN>, <NAME_PIECE> ]
Given name or earned name. Different given names are separated by a comma.

NAME_PIECE_NICKNAME:=

[ <NAME_PIECE> | <NAME_PIECE_NICKNAME>, <NAME_PIECE> ]
A descriptive or familiar name used in connection with one's proper name.

NAME_PIECE_PREFIX:=

{Size=1:30}

{Size=1:30}

[ <NAME_PIECE> | <NAME_PIECE_PREFIX>, <NAME_PIECE> ]
Non indexing name piece that appears preceding the given name and surname parts. Different name
prefix parts are separated by a comma.
For example:
Lt. Cmndr. Joseph /Allen/ jr.
In this example Lt. Cmndr. is considered as the name prefix portion.

NAME_PIECE_SUFFIX:=

{Size=1:30}

[ <NAME_PIECE> | <NAME_PIECE_SUFFIX>, <NAME_PIECE> ]
Non-indexing name piece that appears after the given name and surname parts. Different name suffix
parts are separated by a comma.
For example:
Lt. Cmndr. Joseph /Allen/ jr.
In this example jr. is considered as the name suffix portion.

NAME_PIECE_SURNAME:=

{Size=1:120}

55

[ <NAME_PIECE> | <NAME_PIECE_SURNAME>, <NAME_PIECE> ]
Surname or family name. Different surnames are separated by a comma.

NAME_PIECE_SURNAME_PREFIX:=

{Size=1:30}

[ <NAME_PIECE> | <NAME_PIECE_SURNAME_PREFIX>, <NAME_PIECE> ]
Surname prefix or article used in a family name. Different surname articles are separated by a comma,
for example in the name "de la Cruz", this value would be "de, la".

NAME_ROMANIZED_VARIATION:=

{Size=1:120}

The romanized variation of the name is written in the same form prescribed for the name used in the
superior <NAME_PERSONAL> context. The method used to romanize the name is indicated by the
line_value of the subordinate <ROMANIZED_TYPE>, for example if romaji was used to provide a
reading of a name written in kanji, then the ROMANIZED_TYPE subordinate to the ROMN tag
would indicate romaji. See page 61. 

NAME_TEXT:=

{Size=1:120}

<TEXT> excluding commas, numbers, special characters not considered diacritics. 

NAME_TYPE:=

{Size=5:30}

 [ aka | birth | immigrant | maiden | married | <user defined>]
Indicates the name type, for example the name issued or assumed as an immigrant.
= also known as, alias, etc.
aka
birth
= name given on birth certificate.
immigrant = name assumed at the time of immigration.
maiden
= maiden name, name before first marriage.
= name was persons previous married name.
married
user_defined= other text name that defines the name type.

NATIONAL_ID_NUMBER:=

{Size=1:30}

A nationally-controlled number assigned to an individual. Commonly known national numbers should
be assigned their own tag, such as SSN for U.S. Social Security Number. The use of the IDNO tag
requires a subordinate TYPE tag to identify what kind of number is being stored.
For example:
n IDNO 43-456-1899

+1 TYPE Canadian Health Registration

NATIONAL_OR_TRIBAL_ORIGIN:=

{Size=1:120}
The person's division of national origin or other folk, house, kindred, lineage, or tribal interest.
Examples: Irish, Swede, Egyptian Coptic, Sioux Dakota Rosebud, Apache Chiricawa, Navajo Bitter
Water, Eastern Cherokee Taliwa Wolf, and so forth.

NEW_TAG:=

{Size=1:15}

A user-defined tag that is contained in the GEDCOM current transmission. This tag must begin with

56

an underscore (_) and should only be interpreted in the context of the sending system.

NOBILITY_TYPE_TITLE:=

{Size=1:120}
The title given to or used by a person, especially of royalty or other noble class within a locality.

NULL:=

{Size=0:0}

A convention that indicates the absence of any 8-bit ASCII character in the value including the null
character (0x00) which is prohibited.

NUMBER:=

[<DIGIT> | <NUMBER>+<DIGIT>]

OCCUPATION:=

{Size=1:90}

The kind of activity that an individual does for a job, profession, or principal activity.

ORDINANCE_PROCESS_FLAG:=

{Size=2:3}

[ yes | no ]
A flag that indicates whether submission should be processed for clearing temple ordinances. 

PEDIGREE_LINKAGE_TYPE:=
[ adopted | birth | foster | sealing ]
A code used to indicate the child to family relationship for pedigree navigation purposes.
Where:
adopted = indicates adoptive parents.
birth
foster = indicates child was included in a foster or guardian family.
sealing = indicates child was sealed to parents other than birth parents. 

= indicates birth parents.

{Size=5:7}

PERMANENT_RECORD_FILE_NUMBER:= 

{Size=1:90} 

<REGISTERED_RESOURCE_IDENTIFIER>:<RECORD_IDENTIFIER>
The record number that uniquely identifies this record within a registered network resource. The
number will be usable as a cross-reference pointer. The use of the colon (:) is reserved to indicate the
separation of the "registered resource identifier" (which precedes the colon) and the unique "record
identifier" within that resource (which follows the colon). If the colon is used, implementations that
check pointers should not expect to find a matching cross-reference identifier in the transmission but
would find it in the indicated database within a network. Making resource files available to a public
network is a future implementation.

PHONE_NUMBER:=
A phone number.

PHONETIC_TYPE:=

[<user defined> | hangul | kana]

{Size=1:25}

{Size=5:30}

57

Indicates the method used in transforming the text to the phonetic variation.
<user define> record method used to arrive at the phonetic variation of the name.
hangul Phonetic method for sounding Korean glifs.
kana

Hiragana and/or Katakana characters were used in sounding the Kanji character used by
japanese

PHYSICAL_DESCRIPTION:=

{Size=1:248}

An unstructured list of the attributes that describe the physical characteristics of a person, place, or
object. Commas separate each attribute.
Example:
1 DSCR Hair Brown, Eyes Brown, Height 5 ft 8 in

2 DATE 23 JUL 1935

PLACE_HIERARCHY:=

{Size=1:120}
This shows the jurisdictional entities that are named in a sequence from the lowest to the highest
jurisdiction. The jurisdictions are separated by commas, and any jurisdiction's name that is missing is
still accounted for by a comma. When a PLAC.FORM structure is included in the HEADER of a
GEDCOM transmission, it implies that all place names follow this jurisdictional format and each
jurisdiction is accounted for by a comma, whether the name is known or not. When the PLAC.FORM
is subordinate to an event, it temporarily overrides the implications made by the PLAC.FORM
structure stated in the HEADER. This usage is not common and, therefore, not encouraged. It should
only be used when a system has over-structured its place-names.

PLACE_LATITUDE:=

{Size=5:8}

The value specifying the latitudinal coordinate of the place name. The latitude coordinate is the
direction North or South from the equator in degrees and fraction of degrees carried out to give the 
desired accuracy. For example:  18 degrees, 9 minutes, and 3.4 seconds North would be formatted as
N18.150944.  Minutes and seconds are converted by dividing the minutes value by 60 and the seconds
value by 3600 and adding the results together. This sum becomes the fractional part of the degree’s
value.

PLACE_LIVING_ORDINANCE:=

{Size=1:120}

<PLACE_NAME>
The locality of the place where a living LDS ordinance took place.  Typically, a living LDS baptism
place would be recorded in this field.

PLACE_LONGITUDE:=

{Size=5:8}

The value specifying the longitudinal coordinate of the place name. The longitude coordinate is 
Degrees and fraction of degrees east or west of the zero or base meridian coordinate. For example:
168 degrees, 9 minutes, and 3.4 seconds East would be formatted as E168.150944.  

PLACE_NAME:=

[

{Size=1:120}

58

 <PLACE_TEXT> |                                
 <PLACE_TEXT>, <PLACE_NAME>                         
]                                    
The jurisdictional name of the place where the event took place. Jurisdictions are separated by
commas, for example, "Cove, Cache, Utah, USA." If the actual jurisdictional names of these places
have been identified, they can be shown using a PLAC.FORM structure either in the HEADER or in
the event structure. (See <PLACE_HIERARCHY>, page 58.)

PLACE_PHONETIC_VARIATION:=

{Size=1:120}

The phonetic variation of the place name is written in the same form as  was the place name used in
the superior <PLACE_NAME> primitive, but phonetically written using the method indicated by the
subordinate <PHONETIC_TYPE> value, for example if hiragana was used to provide a reading of a a
name written in kanji, then the <PHONETIC_TYPE> value would indicate kana. (See
<PHONETIC_TYPE> page 57.)

PLACE_ROMANIZED_VARIATION:=

{Size=1:120}

The romanized variation of the place name is written in the same form prescribed for the place name
used in the superior <PLACE_NAME> context. The method used to romanize the name is indicated
by the line_value of the subordinate <ROMANIZED_TYPE>, for example if romaji was used to
provide a reading of a place name written in kanji, then the <ROMANIZED_TYPE> subordinate to
the ROMN tag would indicate ‘romaji’. (See <ROMANIZED_TYPE> page 61.)

PLACE_TEXT:=

<TEXT> excluding the comma(s).

POSSESSIONS:=

A list of possessions (real estate or other property) belonging to this individual.

PUBLICATION_DATE:=

<DATE_EXACT>
The date this source was published or created.

{Size=1:120}

{Size=1:248}

{Size=10:11}

RECEIVING_SYSTEM_NAME:=

{Size=1:20}

The name of the system expected to process the GEDCOM-compatible transmission. The registered
RECEIVING_SYSTEM_NAME for all GEDCOM submissions to the Family History Department
must be one of the following names:

! "ANSTFILE" when submitting to Ancestral File.
! "TempleReady" when submitting for temple ordinance clearance.

RECORD_IDENTIFIER:=

{Size=1:18}

An identification number assigned to each record within a specific database. The database to which the
RECORD_IDENTIFIER pertains is indicated by the REGISTERED_RESOURCE_NUMBER which

59

precedes the colon (:). If the RECORD_IDENTIFIER is not preceded by a colon, it is a reference to a
record within the current GEDCOM transmission.

REGISTERED_RESOURCE_IDENTIFIER:=

{Size=1:25}

This is an identifier assigned to a resource database that is available through access to a network. This
is for future GEDCOM releases.

RELATION_IS_DESCRIPTOR:=

{Size=1:25}

A word or phrase that states object 1's relation is object 2. For example you would read the following
as "Joe Jacob's great grandson is the submitter pointed to by the @XREF:SUBM@":
0 INDI

1 NAME Joe /Jacob/
1 ASSO @<XREF:SUBM>@
2 RELA great grandson

RELIGIOUS_AFFILIATION:=

{Size=1:90}

A name of the religion with which this person, event, or record was affiliated.

RESPONSIBLE_AGENCY:=

{Size=1:120}
The organization, institution, corporation, person, or other entity that has responsibility for the
associated context. For example, an employer of a person of an associated occupation, or a church
that administered rites or events, or an organization responsible for creating and/or archiving records.

RESTRICTION_NOTICE:=

{Size=6:7}

[confidential | locked | privacy ]
The restriction notice is defined for Ancestral File usage.  Ancestral File download GEDCOM files
may contain this data.
Where:
confidential = This data was marked as confidential by the user.  In some systems data marked as

confidential will be treated differently, for example, there might be an option that
would stop confidential data from appearing on printed reports or would prevent that
information from being exported.

locked

= Some records in Ancestral File have been satisfactorily proven by evidence, but

because of source conflicts or incorrect traditions, there are repeated attempts to
change this record. By arrangement, the Ancestral File Custodian can lock a record so
that it cannot be changed without an agreement from the person assigned as the
steward of such a record. The assigned steward is either the submitter listed for the
record or Family History Support when no submitter is listed.

privacy

= Indicate that information concerning this record is not present due to rights of or an
approved request for privacy. For example, data from requested downloads of the

60

Ancestral File may have individuals marked with ‘privacy’  if they are assumed living,
that is they were born within the last 110 years and there isn’t a death date.  In certain
cases family records may also be marked with the RESN tag of privacy if either
individual acting in the role of HUSB or WIFE is assumed living.

ROLE_DESCRIPTOR:=

{Size=1:25}   

A word or phrase that identifies a person's role in an event being described. This should be the same
word or phrase, and in the same language, that the recorder used to define the role in the actual
record.

ROLE_IN_EVENT:=

{Size=1:15}

[ CHIL | HUSB | WIFE | MOTH | FATH | SPOU | (<ROLE_DESCRIPTOR>) ]
Indicates what role this person played in the event that is being cited in this context. For example, if
you cite a child's birth record as the source of the mother's name, the value for this field is "MOTH." If
you describe the groom of a marriage, the role is "HUSB." If the role is something different than one
of the six relationship role tags listed above then enclose the role name within matching parentheses.

ROMANIZED_TYPE:=

 [<user defined> | pinyin | romaji | wadegiles]
Indicates the method used in transforming the text to a romanized variation.

SCHOLASTIC_ACHIEVEMENT:=

A description of a scholastic or educational achievement or pursuit.

SEX_VALUE:=

A code that indicates the sex of the individual:
M = Male
F = Female
U = Undetermined from available records and quite sure that it can’t be.

SOCIAL_SECURITY_NUMBER:=

A number assigned to a person in the United States for identification purposes.

SOURCE_CALL_NUMBER:=

{Size=5:30}

{Size=1:248}

{Size=1:7}

{Size=9:11}

{Size=1:120}

An identification or reference description used to file and retrieve items from the holdings of a
repository.

SOURCE_DESCRIPTION:=

{Size=1:248}

A free form text block used to describe the source from which information was obtained.  This text
block is used by those systems which cannot use a pointer to a source record. It must contain a
descriptive title, who created the work, where and when it was created, and where the source data
stored. The developer should encourage users to use an appropriate style for forming this free form
bibliographic reference.  Developers are encouraged to support the SOURCE_RECORD method of

61

reporting bibliographic reference descriptions. 

SOURCE_DESCRIPTIVE_TITLE:=

{Size=1:248}  

The title of the work, record, or item and, when appropriate, the title of the larger work or series of
which it is a part.

For a published work, a book for example, might have a title plus the title of the series of which the
book is a part. A magazine article would have a title plus the title of the magazine that published the
article.

For An unpublished work, such as:
! A letter might include the date, the sender, and the receiver.
! A transaction between a buyer and seller might have their names and the transaction date.
! A family Bible containing genealogical information might have past and present owners and a

physical description of the book.   

! A personal interview would cite the informant and interviewer.

SOURCE_FILED_BY_ENTRY:=

{Size= 1:60}

This entry is to provide a short title used for sorting, filing, and retrieving source records.

SOURCE_JURISDICTION_PLACE:=

{Size=1:120}

<PLACE_NAME>
The name of the lowest jurisdiction that encompasses all lower-level places named in this source.  For
example, "Oneida, Idaho" would be used as a source jurisdiction place for events occurring in the
various towns within Oneida County. "Idaho" would be the source jurisdiction place if the events
recorded took place in other counties as well as Oneida County.

SOURCE_MEDIA_TYPE:=

{Size=1:15}

[ audio | book | card | electronic | fiche | film | magazine |
 manuscript | map | newspaper | photo | tombstone | video ]
A code, selected from one of the media classifications choices above, that indicates the type of
material in which the referenced source is stored.

SOURCE_ORIGINATOR:=

{Size=1:248}

The person, agency, or entity who created the record. For a published work, this could be the author,
compiler, transcriber, abstractor, or editor. For an unpublished source, this may be an individual, a
government agency, church organization, or private organization, etc.

SOURCE_PUBLICATION_FACTS:=

{Size=1:248}

When and where the record was created. For published works, this includes information such as the
city of publication, name of the publisher, and year of publication.

For an unpublished work, it includes the date the record was created and the place where it was

62

created. For example, the county and state of residence of a person making a declaration for a pension
or the city and state of residence of the writer of a letter.

SUBMITTER_NAME:=

{Size=1:60}

The name of the submitter formatted for display and address generation.

SUBMITTER_REGISTERED_RFN:=

{Size=1:30}
A registered number of a submitter of Ancestral File data.  This number is used in subsequent
submissions or inquiries by the submitter for identification purposes.

SUBMITTER_TEXT:=

Comments or opinions from the submitter.

TEMPLE_CODE:=

{Size=1:248}

{Size=4:5}

An abbreviation of the temple in which LDS temple ordinances were performed. (See Appendix B,
page 96.)

TEXT:=

A string composed of any valid character from the GEDCOM character set.

TEXT_FROM_SOURCE:=

{Size=1:248}

{Size=1:248}

<TEXT>
A verbatim copy of any description contained within the source. This indicates notes or text that are
actually contained in the source document, not the submitter's opinion about the source. This should
be, from the evidence point of view, "what the original record keeper said" as opposed to the
researcher's interpretation. The word TEXT, in this case, means from the text which appeared in the
source record including labels.

TIME_VALUE:=
[ hh:mm:ss.fs ]
The time of a specific event, usually a computer-timed event, where:
hh = hours on a 24-hour clock
mm = minutes
ss
fs

= seconds (optional)
= decimal fraction of a second (optional)

TRANSMISSION_DATE:=

<DATE_EXACT>
The date that this transmission was created.

{Size=1:12}

{Size=10:11}

USER_REFERENCE_NUMBER:=

{Size=1:20}

A user-defined number or text that the submitter uses to identify this record. For instance, it may be a
record number within the submitter's automated or manual system, or it may be a page and position

63

number on a pedigree chart.

USER_REFERENCE_TYPE:=

A user-defined definition of the USER_REFERENCE_NUMBER.

VERSION_NUMBER:=

{Size=1:40}

{Size=1:15}

An identifier that represents the version level assigned to the associated product. It is defined and
changed by the creators of the product.

WHERE_WITHIN_SOURCE:=

{Size=1:248}
Specific location with in the information referenced. For a published work, this could include the
volume of a multi-volume work and the page number(s). For a periodical, it could include volume,
issue, and page numbers. For a newspaper, it could include a column number and page number. For an
unpublished source or microfilmed works, this could be a film or sheet number, page number, frame
number, etc. A census record might have an enumerating district, page number, line number, dwelling
number, and family number.  The data in this field should be in the form of a label and value pair, such
as Label1: value, Label2: value, with each pair being separated by a comma. For example, Film:
1234567, Frame: 344, Line: 28.

XREF:=

{Size=1:22}

Either a pointer or an unique cross-reference identifier. If this element appears before the tag in a
GEDCOM line, then it is a cross-reference identifier. If it appears after the tag in a GEDCOM line,
then it is a pointer. The method of delimiting a pointer or cross-reference identifier is to enclose the
pointer or cross-reference identifier within at signs (@), for example, @I123@. A XREF may not
begin with a number sign (#). This is to avoid confusion with an escape sequence prefix (@#). The use
of a colon (:) in the XREF is reserved for creating future network cross-references and the use of an
exclamation (!) is reserved for intra-record pointers. Uniqueness of the cross-reference identifier is
required within the transmission file.

XREF:FAM:=

A pointer to, or a cross-reference identifier of, a fam_record.

XREF:INDI:=

A pointer to, or a cross-reference identifier of, an individual record.

XREF:NOTE:=

A pointer to, or a cross-reference identifier of, a note record.

XREF:OBJE:=

A pointer to, or a cross-reference identifier of, a multimedia object.

XREF:REPO:=

A pointer to, or a cross-reference identifier of, a repository record.

{Size=1:22}

{Size=1:22}

{Size=1:22}

{Size=1:22}

{Size=1:22}

64

XREF:SOUR:=

A pointer to, or a cross-reference identifier of, a SOURce record.

XREF:SUBM:=

A pointer to, or a cross-reference identifier of, a SUBMitter record.

XREF:SUBN:=

A pointer to, or a cross-reference identifier of, a SUBmissioN record.

YEAR:=

A numeric representation of the calendar year in which an event occurred.

YEAR_GREG:=

{Size=1:22}

{Size=1:22}

{Size=1:22}

{Size=3:4}

{Size=3:7}

[ <NUMBER> | <NUMBER>/<DIGIT><DIGIT> ]
The slash "/" <DIGIT><DIGIT> a year modifier which shows the possible date alternatives for pre-
1752 date brought about by a changing the beginning of the year from MAR to JAN in the English
calendar change of 1752, for example, 15 APR 1699/00. A (B.C.) appended to the <YEAR> indicates
a date before the birth of Christ. 

65

66

Compatibility with Other GEDCOM Versions

GEDCOM compatibility is measured on a per tag basis, and depends on how similar the data models are
for the two different communicating products and on how consistently they understood and complied
with the GEDCOM Standard. A few inconsistencies in the use of specific tags also crept into different
releases of the standard itself, due to lack of foresight or inadvertent errors.  Within these limits,
GEDCOM compatible products can exchange data based on GEDCOM 2.0, 3.0, 4.0, and 5.x. Of course,
newer GEDCOM releases significantly extend the data model for which the newer tag contexts will not
be supported by older products.  Some products have introduced their own variations into their
GEDCOM form.  This will likely provide unique compatibility problems.

The following are areas in which incompatibilities may arise:

! Source Structure:

The SOURce structure was not supported by GEDCOM in versions before 5.x. However, some
products, prior to GEDCOM 5.x, developed a SOURce structure for citing sources. These structures
varied from product to product, which affects how source citations are interpreted. Products based on
5.x GEDCOM, prior to GEDCOM 5.4, may have used the more detailed source structure suggested
by the previous 5.x versions. Older systems already handling sources will need to be modified.
GEDCOM 5.x draft products are encouraged to update their programs to The GEDCOM Standard
5.5 as soon as possible.

! FAMC Pointer:

The INDI.FAMC structure has been modified a lot since GEDCOM 4.0. In previous GEDCOM 5.x
versions the FAMC structure may contain subordinate adoption events and/or LDS sealing to parent
events. See the compatibility implications concerning the LDS sealing to parent event treated in the
"LDS Ordinances Dates" in the next paragraph.

! LDS Ordinance Dates:

The structure for LDS sealing of child to parent was changed in previous GEDCOM 5.x draft versions
from the FAM.CHIL.SLGC structure to the INDI.FAMC.SLGC structure. This was to allow access
to child sealing information without having to follow a pointer to the family record. Personal Ancestral
File 2.31 writes the sealing date in the FAM.CHIL.SLGC structure but reads this information from
either format. A new major release of Personal Ancestral File will change to the newer approach.

GEDCOM 5.4 places the sealing of child to parent event at the same level as all of the other events
that are subordinate to the INDIvidual tag.  If a system is keeping track of which family the individual
is sealed to, then a FAMC pointer is additionally inserted subordinate to the SLGC event tag that
points to the sealed-to-family. 

To accommodate previous GEDCOM imports, systems handling the LDS ordinance events should
look for the child sealing information in either INDI.SLGC (see LDS_INDIVIDUAL_ORDINANCE
page 35, 36, INDI.FAMC.SLGC or FAM.CHIL.SLGC structures.  Ancestral File exports did not

67

separate the temple code from the ordinance date.  Ordinance dates down-loaded from Ancestral File
may contain an ordinance date followed by a two digit temple code rather than a separate temple code
line. 

GEDCOM 4.x systems used certain key words as part of the ordinance dates. GEDCOM 5.x
separated these codes from the dates and specified that they should be values of a subordinate
STATus tag. Previous GEDCOM 5.x implementations may have implemented this feature using a
TYPE tag instead of the STATus tag. (See <LDS_(ordinance)_DATE_STATUS>, page 51, 52.)

! Adoption Events:

In GEDCOM 5.x, the ADOPtion event was moved from the FAM.CHIL structure to the
INDI.FAMC.ADOP structure, it also appears in the INDI.ADOP structure. In GEDCOM 5.4 the
ADOPtion event appears only as an individual event which optionally contains a FAMC pointer to the
adoptive family.  Subordinate to this pointer is another ADOPtion tag which indicates whether the
HUSB or WIFE in the pointed at family was the adoptive parent (see
<ADOPTED_BY_WHICH_PARENTS> primitive on page 42). Pedigree navigation is provided only
by <<CHILD_TO_FAMILY_LINK>> structure found on page 31.

! Codes in Event Date:

Some applications, such as Personal Ancestral File, pass key words as part of certain event dates.
Some of these key words were INFANT, CHILD, STILLBORN, etc.  These have to do with being an
approximate age at an event.

In this version of GEDCOM, the information has been removed from the date value and specified by
an <AGE_AT_EVENT> key word value which indicates a descriptive age value at the time of the
enclosing event. (See <AGE_AT_EVENT>, page 42.) For example:

1 DEAT

2 DATE 13 MAY 1984
2 AGE STILLBORN

meaning this person died at age approximately 0 days old.

1 DEAT

2 DATE 13 MAY 1984
2 AGE INFANT

meaning this person died at age less than 1 year old.

! Multiple Names:

GEDCOM 5.x requires listing different names in different NAME structures, with the preferred
instance first, followed by less preferred names. However, Personal Ancestral File and other products
that only handle one name may use only the last instance of a name from a GEDCOM transmission.
This causes the preferred name to be dropped when more than one name is present. The same thing
often happens with other multiple-instance tags when only one instance was expected by the receiving
system.

68

!Alias Names:

One or two systems used the  ALIAs tag for representing multiple names.  This form is not supported
in the GEDCOM Standard version 5.5.

!Event Structure:

The address structure, as part of the place structure, provided more detail than desired for the PLACe
structure.  Therefore it was removed from beneath the place structure and added to the
<<EVENT_DETAIL>> structure at the same level as PLACe.  The SITE tag was also eliminated
from the PLACe structure since the site of an event is really part of an address, such as Primary
Children's Hospital, 100N Medical Drive, Salt Lake City, Utah.

!Supplemental Attributes or Facts :

Sometimes other attributes or facts are used to describe an individual's actions, physical description,
employment, education, places of residence, etc. These are not generally thought of as events.
However, they are often described like events because they were observed at a particular time and/or
place. GEDCOM 5.x lists these attributes under the
<<INDIVIDUAL_ATTRIBUTE_STRUCTURE>> on page  33 and allows them to be recorded in the
same way as events.  The attribute definition allows a value on the same line as the attribute tag. In
addition, it allows a subordinate date period, place and/or address, etc. to be transmitted, just as the
events are. Previous versions, which handled just a tag and value, can be read as usual by handling the
subordinate attribute detail as an exception.

Modifications in Version 5.5 as a result of the 5.4 (draft) review

!Added tags for storing detailed address pieces  under the address structure.

!Added nickname and surname prefix name pieces to the personal name structure.  Removed the

convention of specifying a nickname in double quotes.  This convention was introduced in GEDCOM
5.4 (draft).

!Added subordinate source citation to the note structure.

!Added encoding rules for including embedded multimedia objects. (Removed in 5.51)

!Added a RIN tag to the record structures.  The RIN tag is a record identification assigned to the

record by the source software.  Its intended use is to allow for automated access to that record upon
receipt of return transactions or other reconciliation processes.

!The meaning of a GEDCOM tag without a value on its line depends on its subordinate context for any
assertions intended by the researcher. For example, In an event structure, a subordinate DATE and/or
PLACe value imply that an event happened. However, a subordinate NOTE or SOURce context by
themselves do not imply that the event took place. For a researcher to indicate that an event took
place without knowing a date or a place requires that a Y(es) value be added to the event tag line.

69

Using this convention protects GEDCOM processors which may remove (prune) lines that have no
value and also no subordinate lines. A N(o) value must not be used on an event tag line to assert that
the event never happened. This requires the definition of a different tag.

! Returned the calendar escape sequence to support alternate calendars.

! The definition of the date value was refined to include many of the potential ways in which a person
may define an imprecise date in a free form text field.  Systems which guide users through a date
statement should not result in such a precise way of stating an imprecise date.  For example, if
software was to estimate a marriage date based on an algorithm involving the birth date of the couple's
first child, hardly needs to say "EST ABT 1881" but rather “EST 1881."

! The following tags were added:

ADR1, ADR2, CITY, NICK, POST, SPFX

Changes Introduced or Modified in Draft Version 5.4

Some changes introduced in GEDCOM draft version 5.4 are not compatible with earlier 5.x draft forms.
Some concepts have been removed with the intent to address them in a future release of GEDCOM.   The
following features are either new or different:

! The use of the SCHEMA has been eliminated. Although the schema concept is valid and essential to
the growth of GEDCOM, it is too complex and premature to be implemented successfully into current
products. Implementing it too early could cause developers to spend a great deal of resources
programming something that would be outdated very quickly. Object definition languages are likely to
contribute to meeting these needs.

! The EVENT_RECORD context has been eliminated. This context was intended to support the
evidence record concept in the Lineage-Linked GEDCOM Form, which ended up being more
complicated than first supposed. Understanding the difference between the role of a source record and
the role of a so-called evidence record requires further study.

! Non-standard tags (see <NEW_TAG>, page 56) can be used within a GEDCOM transmission,

provided that the first character is an underscore (for example _NUTAG). Non-standard tags should
be used only when structured information cannot be represented using existing context. Using a Note
field is a more universal way of transmitting genealogical data that does not fit into the standard
GEDCOM structure.

! The SOURCE_RECORD structure was simplified into five basic sections: data or classification,

author, title, publication facts, and repository. The data or classification section contains facts about
the data represented by this source and is used to analyze the collection of sources that the researcher
used. The author, title, publication facts, and repository sections provide free-form text blocks that
inform subsequent researchers how to access the source data that the original researcher used.

70

! Added a <<SOURCE_CITATION>> structure subordinate to the fact being cited. It is generally best
if the source citation contains only information specific to the fact being cited and then points to the
more general description of the source, defined in a SOURCE_RECORD. This reduces redundancy,
provides a way of controlling the GEDCOM record size, and more closely represents the normalized
data model.

! Systems that describe sources using the AUTHor, TITLe, PUBLication, and REPOsitory fields  can
and should always pass this information in GEDCOM using a SOURce record pointed to by the
<<SOURCE_CITATION>>. Systems that only allow free form source notes should encourage
forming the source information so that it include text about these categories:

! TITL: A descriptive title of the source
! AUTH: Who created the work
! PUBL: When and where was it created
! REPO: Where can it be obtained or viewed

When possible provide the tag for these categories within the text so that a receiving system could
parse them to fit the recommended source/citation structure.. 

! Some attributes of individuals such as their EDUCation, OCCUpation, RESIdence, or nobility TITLe
need to be described using a date and place.  Therefore, the structure to describe these attributes was
formatted to be the same as for describing events. That is, these attributes are further defined using a
date, place, and other attributes used to describe events. (See <<EVENT_DETAIL>>, page 32 and
<<INDIVIDUAL_ATTRIBUTE_STRUCTURE, PAGE 33>>.)

! The LDS ordinance structure was extended to include the place of a living LDS ordinance. The TYPE
tag line was changed to a STATus tag line.  This allows statements such as BIC, canceled, Infant,
and so forth to be removed from the date line and be added here under the STATus tag. (See
<LDS_(ordinance)_DATE_STATUS>, page 51, 52) where (ordinance) represents any of the
following: BAPTISM, ENDOWMENT, CHILD_SEALING, or SPOUSE_SEALING.

! Previous GEDCOM 5.x versions overloaded the FAMC pointer structure with subordinate events
which connected individual events and an associated family.  An adoption event, for example, was
shown subordinate to the FAMC pointer to indicate which was the adoptive family. The sealing of
child to parent event (SLGC) was also shown in this manner.  GEDCOM 5.4 recognizes that these
are events and should be at the same level as the other individual events.  To show the associated
family, a subordinate FAMC pointer is placed subordinate to the appropriate event. (See
<<INDIVIDUAL_EVENT_STRUCTURE>> page 34 and LDS_INDIVIDUAL_ORDINANCE at
page 35, 36.)

! The date modifier (int) was added to the date format to indicate that the associated date phrase has

been interpreted and the interpretation follows the int prefix in the date field.  The date phrase is also
included in the date value enclosed in parentheses. (See <DATE_APPROXIMATED>, page 45.)

! The <AGE_AT_EVENT> primitive definition now includes the key words STILLBORN, INFANT,

71

and CHILD. These words should be interpreted as being an approximate age at an event. (See
<AGE_AT_EVENT>, page 42.)

! The family event context in the FAMily record now allows the ages of both the husband and wife at

the time of the event to be shown. (See FAM_RECORD page 24)

! The <<PERSONAL_NAME_STRUCTURE>> structure now allows name pieces to be specifically
identified as subordinate parts of the name line. Most products will not use subordinate name pieces.
A nickname can now be included on the name line by enclosing it in double quotation marks (changed
in 5.5.)  Note: Systems using the subordinate name parts must still provide the name structure
formed in the same way specified for <NAME_PERSONAL> (see page 54.)

! A submission record was added to GEDCOM to enable the sending system to transmit information

which will enable the receiving system to more appropriately process the GEDCOM data. The format
currently designed for the submission record was created specifically for TempleReady™  system and
for GEDCOM files being downloaded from Ancestral File™ . (See SUBMISSION_RECORD, page
28.)

! A RESTRICTION (RESN) tag and a <RESTRICTION_NOTICE> primitive were added to the
INDIVIDUAL_RECORD context. (Also added to the family record in 5.5.1.) This allows some
records in Ancestral File to be marked for privacy (indicating some personal information is not
included) and some records to be marked as locked (indicating that Ancestral File will not make
changes to the record without authorization from an assigned record steward). 

! The following tags are no longer used in the Lineage-Linked Form:

ARVL, BROT, BUYR, CEME, CNTC, CPLR, DEFM, DPRT, EDTR, FIDE, FILM, GODP, HDOH,
HEIR, HFAT, HMOT, INFT, INDX, INTV, ISA, ISSU, ITEM, LABL, LCCN, LGTE, MBR,
NAMS, NAMR, OFFI, ORIG, OWNR, PERI, PORT, PWIF, PUBR, RECO, SELR, SEQU, SERS,
SIBL, SIGN, SIST, SITE, TXPY, XLTR, WFAT, WITN, WMOT, AUDIO, IMAGE, PHOTO,
SCHEMA, VIDEO

! The following tags were added:

BLOB, CTRY, CREM, FCOM, GIVN, NPFX, NSFX, OBJE, PEDI, RELA, RESI, RESN, SUBN,
SURN, STAT

Changes Introduced in Draft Version 5.3

Version 5.3 introduced the following changes to the GEDCOM standard:

! An address structure was defined.

! A new tag for marital status (MSTA) at the time of an event was added to the event structure. (This

was removed in version 5.4.)

72

!A mechanism for creating user-defined tags was added. These were defined in a SCHEMA definition

in the header record of 5.3. (SCHEMA was removed in version 5.4.)

!The Unicode standard (ISO 10646) was introduced as an additional character set. (This was reduced

to potential character set in version 5.4. See Chapter 3, page 77.)

!A <<MULTIMEDIA_LINK>> structure was introduced to provide linking and embedding of

digitized photo, video, and sound files. (This was modified in version 5.4).( See
MULTIMEDIA_LINK page 37 and MULTIMEDIA_RECORD page 26)

!The source structure NAME tag, meaning the name of the source in the

<<SOURCE_CITATION>>, was changed back to the TITLe tag and is used to show the title of a
book, article, or descriptive title of non-titled sources.

!The <<SOURCE_CITATION>> was changed. Usage of CPLR, XLTR, and INFT tags in source

substructures was discontinued.

!The FORM {FORMAT} tag was added subordinate to the PLACe and the GEDCom tags in the

HEADER record and also subordinate to the PLACe tag in the <<PLACE_STRUCTURE>>. The
PLAC.FORM line in the header record indicates that all of the locality names are specified in a
consistent hierarchical sequence as specified by the value of the FORM. For example: 2 FORM City,
County, State. GEDCOM 5.2 used the TYPE tag, subordinate to the PLAC tag instead of the FORM
tag, for this purpose. This provision is for products which have overly structured the place value.

Packaging the GEDCOM Transmission File

The GEDCOM transmission is normally created on a DOS or Macintosh® compatible diskette. The DOS
filename extension is (.GED). Macintosh filenames do not use file extensions.

When the GEDCOM file is too large to fit on a single diskette, the file is divided after any whole-line (last
character is the terminator), and the DOS filename extension becomes (G##) where (##) is (00) for the
second disk, (01) for the third, and so forth. For Macintosh filenames, append the two digits to the
subsequent filenames in parentheses. (See the example below.) This allows the receiving software to
ensure that disks are read in the correct sequence.

Given that the user-supplied portion of the file name is SMITH, then the complete filenames for a three-
disk transmission would be:

Disk DOS Filename
SMITH.GED
 1 
SMITH.G00
 2 

Macintosh Filename
SMITH
SMITH(00)

73

 3

SMITH.G01

SMITH(01)

The required GEDCOM HEADer record appears only on the first disk and the required TRLR (trailer)
record appears only on the last disk and must be followed by the terminator.

User-Defined Tags
We do not encourage the use of user-defined GEDCOM tags. Applications requiring the use of non-
standard tags should define them with a leading underscore so that they will not conflict with future
GEDCOM standard tags. Systems that read user-defined tags must consider that they have meaning only
with respect to a system contained in the HEAD.SOUR context.

Escape Sequence Format for the Lineage-Linked Form
Very few Lineage-Linked GEDCOM compatible systems uses the escape sequence feature provided in
the GEDCOM grammar.

Sample Lineage-Linked GEDCOM Transmission
The example below is a sample transmission of genealogical information about three individuals who are
members of the same family—father, mother, and child.  In the example, "Joe/Williams/" is the value
specified by the tag NAME under the INDI tag for the record (@3@). Other values in other lines, such as
the birth date and place, provide additional information about Joe Williams. The value (@4@) specified
by the FAMC tag is a pointer to the FAM_RECORD (@4@) of which Joe Williams is a child. Included
also in this transmission example are three other record types: a source record, a submitter record, and a
repository record. These records are pointed to from within other records in the transmission. This shows
how pointer values can be used in creating Lineage-Linked GEDCOM Form.

Example: (Indentation and bolding are added for readability only.)

0 HEAD

1 SOUR PAF
2 VERS 2.1

1 DEST ANSTFILE
1 SUBM @5@
1 SUBN @8@
1 GEDC

2 VERS 5.4
2 FORM Lineage-Linked

1 CHAR ANSEL

0 @1@ INDI

1 NAME Robert Eugene/Williams/
1 SEX M
1 BIRT

2 DATE 02 OCT 1822
2 PLAC Weston, Madison, Connecticut
2 SOUR @6@

3 PAGE Sec. 2, p. 45
3 EVEN BIRT               

4 ROLE CHIL

74

1 DEAT

2 DATE 14 APR 1905
2 PLAC Stamford, Fairfield, CT

1 BURI

2 PLAC Spring Hill Cem., Stamford, CT

1 RESI

2 ADDR 73 North Ashley

3 CONT Spencer, Utah UT84991

2 DATE from 1900 to 1905

1 FAMS @4@
1 FAMS @9@

0 @2@ INDI

1 NAME Mary Ann/Wilson/
1 SEX F
1 BIRT

2 DATE BEF 1828
2 PLAC Connecticut

1 FAMS @4@

0 @3@ INDI

1 NAME Joe/Williams/
1 SEX M
1 BIRT

2 DATE 11 JUN 1861
2 PLAC Idaho Falls, Bonneville, Idaho
2 FAMC @4@                                       /* note: this ptr is not required but is allowed in 5.5 */ 

1 FAMC @4@
1 FAMC @9@

2 PEDI Adopted

1 ADOP

2 FAMC @9@
2 DATE 16 MAR 1864

1 SLGC

2 FAMC @9@
2 DATE 2 OCT 1987
2 TEMP SLAKE

0 @4@ FAM
1 MARR

2 DATE DEC 1859
2 PLAC Rapid City, South Dakota

1 SLGS

2 DATE 14 JUN 1975
2 TEMP SLAKE

1 HUSB @1@
1 WIFE @2@
1 CHIL @3@
0 @5@ SUBM

1 NAME Reldon /Poulson/
1 ADDR 1900 43rd Street West
2 CONT Billings, MT 68051

1 PHON (406) 555-1232

0 @6@ SOUR

75

1 DATA

2 EVEN BIRT, DEAT, MARR

3 DATE FROM Jan 1820 TO DEC 1825
3 PLAC Madison, Connecticut

2 AGNC Madison County Court, State of Connecticut

1 TITL Madison County Birth, Death, and Marriage Records
1 ABBR VITAL RECORDS
1 REPO @7@

2 CALN 13B-1234.01
3 MEDI Microfilm

0 @7@ REPO

1 NAME Family History Library
1 ADDR 35 N West Temple Street
2 CONT Salt Lake City, Utah
2 CONT UT 84150

0 @8@ SUBN

1 SUBM @5@
1 FAMF Reg Poulson Family
1 TEMP SLAKE

0 @9@ FAM

1 HUSB @1@
1 CHIL @3@

0 TRLR

The following is an example of a SOURCE_CITATION subordinate to the birth event being cited that does not contain a
pointer to a SOURCE_RECORD. (This is not encouraged.)

0 INDI

1 NAME Fred /Jones/
1 BIRT

2 DATE 14 MAY 1812
2 PLAC Tonbridge, Kent, England
2 SOUR Waters, Henry F., Genealogical Gleanings in England: Abstracts of W
3 CONC ills Relating to Early American Families. 2 vols., reprint 1901, 190
3 CONC 7. Baltimore: Genealogical Publishing Co., 1981.
3 CONT Stored in Family History Library book 942 D2wh; films 481,057-58 Vol 2, pa 
3 CONC ge 388.

76

Chapter 3
Using Character Sets in GEDCOM

Introduction

GEDCOM needs to accommodate different character sets to facilitate the sharing of genealogical data in
different languages. To minimize the number of differing standards, we have chosen to have each system
convert its usage to ANSEL, and eventually to UNICODE.

Currently, ANSEL is be used to represent Latin-based characters.

The GEDCOM Standard does not address the implementation methods for multilingual processing, such
as keyboard arrangements, sorting sequences, or character and graphic representations (font styles,
proportional spacing, and so forth) on the CRT or printers. However, the Unicode standard has defined
formatting characters that will indicate the direction of the text presentation and other text formatting
character codes.

Systems using code pages to support diacritical characters, such as the windows ANSI 1252 code page,
must convert all characters above character code 0x7F to its ANSEL representation for that code page.

Most of the genealogy systems developed so far use ASCII, ANSEL, or both. ANSEL accommodates
the set of Latin-based languages, as explained below. 

8-Bit ANSEL

The 8-Bit ANSEL (American National Standard for Extended Latin Alphabet Coded Character Set for
Bibliographic Use, Z39.47-1985 copyright) is currently the preferred character set for GEDCOM.
However this will shortly change to UNICODE and UTF-8 as the support for these latter character forms
becomes fully supported by the computer industry.

ANSEL character set  makes it possible to preserve the integrity of most latin based languages by
providing a method of using the standard ASCII character set and supplementing it with both non-
spacing character modifiers (diacritic) as well as some useful spacing special characters.

Note:Non-spacing means that the diacritic is printed without advancing the device's print position. The
character being modified is then printed in the same position, resulting in a combined image of both the
character and the diacritic(s).

Storing ANSEL requires storing the non-spacing graphic character(s) preceding the ASCII character that
the diacritic is to modify. The ANSEL standard specifies an extended 8-bit configuration (above 128) to
represent the spacing and non-spacing graphic characters that make up most of the Latin based
languages. ANSEL is a super-set of ASCII. The standard ASCII characters including the control

77

characters are preserved.

ANSEL is known by two other names:

!ANSI Z39.47-1985
!American Library Association character set, used in library systems worldwide, including the

MARC (Machine-Readable Catalog) format.

The codes used for the ANSEL character set is described in Appendix C. The full definition  may be
purchased from:

American National Standards Institute
1430 Broadway
New York, N.Y. 10018

Character set codes 0x0 through 0x7F are the same for 8-Bit ANSEL and 8-Bit ASCII (USA
version—ANSI 8-Bit). Character set codes 0x80 through 0xFF are unique to the ANSEL character set.

ASCII (USA Version)

When a language does not need diacritic characters or other special characters, and if you are not
transmitting binary data, you will find it convenient to use ASCII (8-bit USA version) if your computer
already supports it. This is a standard of the American National Standards Institute (ANSI). Most of the
basic printable characters of ANSEL and ASCII (USA version—ANSI 8-Bit) are identical.

UNICODE 

The Unicode standard is a character code designed to encode text for storage in computer files. It is
being developed in close relationship to the ISO 10646 standard. The design of the Unicode standard is
based on the simplicity and consistency of today's prevalent character code set, extended ASCII code set,
but goes far beyond ASCII's limited ability to encode only the Latin alphabet: the Unicode encoding
provides the capacity to encode most all of the characters used for written languages throughout the
world. In order to accommodate the many thousands of characters used in the international text, the
Unicode standard uses a 16-bit code set instead of extended ASCII's 8-bit code set. This expansion
provides codes for approximately 65,000 characters. The text representation of the Unicode 16-bit
numbers is U+0041 which is assigned to the letter A, 65 decimal. The Unicode standard includes
characters for the Latin alphabet used for English, the Cyrillic alphabet used for Russian, the Greek,
Hebrew, and Arabic alphabets. Other alphabets used in countries across Europe, Africa, the Indian
subcontinent, and Asia, such as Japanese Kana, Korean Hangul, and Chinese Bopomofo are included.
(See "The Unicode standard version 2.0", published by Addison-Wesley Publishing, for character code
standards.)

If the Unicode environment is used to produce a GEDCOM transmission, the header record would also
be in Unicode, requiring receiving systems to determine whether the transmission is Unicode or ASCII
before they could interpret the GEDCOM header.

78

UTF-8

UTF-8 is a transformation format that allows unicode characters to be transformed into an 8 bit form.
The transformation scheme allows existing ASCII characters in the range of 0x0 to 0x7F to be
represented using the normal 8 bit character code. Characters from the unicode character set from the
range U+0080 to U+07FF can be represented in two 8-bit codes, and characters from the range U+0800
to U+FFFF are represented by three 8-bit codes.  This method is used by many systems handling mostly
latin characters to save a significant amount of space. The UTF-8 transformation method allows for
efficient transformation to and from the Unicode text. Basically, this 8-bit form uses the high order bits to
determine how to decode each of the 8-bit forms back to the Unicode representation.

How to Change Character Sets

The character set for an entire transmission is specified in the character set line of the header record.

The example below shows the specification in the header record:

Lvl Tag Value
0 HEAD

1 SOUR PAF
2 VERS 2.1

1 DEST ANSTFILE
1 CHAR ANSEL

The character set change remains in effect until the TRLR record is encountered at the end of the
transmission.

UNICODE character set or the 8-bit UTF-8 form should be used for multi-language support as soon as
operating systems begin providing adequate storage and display support.

For more information about character sets, see the following:

!Extended Latin Alphabet Coded Character Set for Bibliographic Use. American National

Standards (ANSEL), Z39.47, 1985. This is an out date version, but is the version established as
the GEDCOM ANSEL standard.

!"The Unicode standard", version 2.0, published by Addison-Wesley Publishing.

79

80

Chapter 4
GEDCOM Product Registration

Registering GEDCOM Products

Developers of GEDCOM compatible products should register their product with the Family History
Department GEDCOM coordinator.

Registration means that:

!The registered GEDCOM product is listed in Family History Department publications as being

GEDCOM 5.5 compatible.

!The product's sample output file has been reviewed according to the established standard, and

exceptions have been reported.

!The developer will be informed of future GEDCOM issues.
!Submissions to Family History Department resource files will be accepted from users of registered

products.

To register a GEDCOM product, a developer must send the following information to the GEDCOM
coordinator:

!A file containing a small sample of the product's GEDCOM output for evaluation. All of the fields

that the product manages must be included in this data so that it can be tested for compatibility with
other developers' products.

!A proposed unique SOURce name that identifies the product, not the company. This identifier should
be included in the GEDCOM header record as a value to the SOUR tag. This name can have up to 40
characters, can have mixed upper and lower case, and cannot have embedded spaces. Use either an
underscore (_) to connect multiple words or else a combination of upper and lower case letters (for
example, FamilyRecords or Family_Records, not Family Records). The Family History Department
will ensure uniqueness within the first 10 characters of this name.

!Optionally, but strongly suggested, a copy of the GEDCOM product with installation procedures and
a text file containing relevant technical documentation about the product's GEDCOM implementation.
The product will be protected and used only for GEDCOM output verification and in providing some
support to submitting users of your product.

Send product registration information to:

EMAIL:
gedcom@gedcom.org

MAIL:

Family History Department

GEDCOM Coordinator—3T
50 East North Temple Street
Salt Lake City, UT 84150

TELEPHONE (USA):
801-240-4534

801-240-3442

81

82

Appendix A
Lineage-Linked GEDCOM Tag Definition

Introduction

Appendix A is a glossary of the tags used in the Lineage-Linked GEDCOM Form. These tags are used in a
hierarchical structure to describe individuals in terms of their families, names, dates, places, events, roles,
sources, relationships.  Control information and other kinds of data intended for computer processing is also
included. (An example of the tags used in the Lineage-Linked Form begins on page 74.) To ensure all
transmitted information in the Lineage-Linked GEDCOM is uniformly identified the standardized tags cannot
be placed in any other context than shown in Chapter 2.  It is legal to extend the context of the form, but only
by using user-defined tags which must begin with an underscore.  This will not violate the lineage-linked
GEDCOM standard unless the context for the grammar of the Lineage-Linked GEDCOM Form is violated.
The use of the underscore in the user tag name is to signal a non-standard construct is being used. This
notifies the reading system of a discrepancy and will avoid future conflicts with tags that may be standardized
in subsequent GEDCOM releases.

Lineage-Linked GEDCOM Tag Definitions

This section provides the definitions of the standardized GEDCOM tags and shows their formal name inside
of the {braces}. The formal names are not used in place of the tag. Full understanding must come from the
context in which the tag is used.

ABBR {ABBREVIATION}:=

A short name of a title, description, or name.

ADDR {ADDRESS}:=

The contemporary place, usually required for postal purposes, of an individual, a submitter of
information, a repository, a business, a school, or a company.

ADR1 {ADDRESS1}:=

The first line of an address. 

ADR2 {ADDRESS2}:=

The second line of an address.

ADOP {ADOPTION}:=

Pertaining to creation of a legally approved child-parent relationship that does not exist biologically.

AFN {AFN}:=

A unique permanent record file number of an individual record stored in Ancestral File. 

AGE {AGE}:=

83

The age of the individual at the time an event occurred, or the age listed in the document.

AGNC {AGENCY}:=

The institution or individual having authority and/or responsibility to manage or govern.

ALIA {ALIAS}:=

An indicator to link different record descriptions of a person who may be the same person.

ANCE {ANCESTORS}:=

Pertaining to forbearers of an individual.

ANCI {ANCES_INTEREST}:=

Indicates an interest in additional research for ancestors of this individual. (See also DESI, page 86.)

ANUL {ANNULMENT}:=

Declaring a marriage void from the beginning (never existed).

ASSO {ASSOCIATES}:=

An indicator to link friends, neighbors, relatives, or associates of an individual.

AUTH {AUTHOR}:=

The name of the individual who created or compiled information.

BAPL {BAPTISM-LDS}:=

The event of baptism performed at age eight or later by priesthood authority of the LDS Church. (See
also BAPM, next)

BAPM {BAPTISM}:=

The event of baptism (not LDS), performed in infancy or later. (See also BAPL, above, and CHR, page
85.)

BARM {BAR_MITZVAH}:=

The ceremonial event held when a Jewish boy reaches age 13.

BASM {BAS_MITZVAH}:=

The ceremonial event held when a Jewish girl reaches age 13, also known as "Bat Mitzvah."

BIRT {BIRTH}:=

The event of entering into life.

BLES {BLESSING}:=

A religious event of bestowing divine care or intercession. Sometimes given in connection with a
naming ceremony.

84

BURI {BURIAL}:=

The event of the proper disposing of the mortal remains of a deceased person.

CALN {CALL_NUMBER}:=

The number used by a repository to identify the specific items in its collections.

CAST {CASTE}:=                               
  The name of an individual's rank or status in society which is sometimes based on racial or religious
differences, or differences in wealth, inherited  rank, profession, occupation, etc.

CAUS {CAUSE}:=

A description of the cause of the associated event or fact, such as the cause of death.

CENS {CENSUS}:=

The event of the periodic count of the population for a designated locality, such as a national or state
Census.

CHAN {CHANGE}:=

Indicates a change, correction, or modification. Typically used in connection with a DATE to specify
when a change in information occurred.

CHAR {CHARACTER}:=

An indicator of the character set used in writing this automated information.

CHIL {CHILD}:=

The natural, adopted, or sealed (LDS) child of a father and a mother.

CHR {CHRISTENING}:=

The religious event (not LDS) of baptizing and/or naming a child.

CHRA {ADULT_CHRISTENING}:=

The religious event (not LDS) of baptizing and/or naming an adult person.

CITY {CITY}:=

A lower level jurisdictional unit.  Normally an incorporated municipal unit.

CONC {CONCATENATION}:=

An indicator that additional data belongs to the superior value. The information from the CONC value
is to be connected to the value of the superior preceding line without a space and without a carriage
return and/or new line character. Values that are split for a CONC tag must always be split at a non-
space.  If the value is split on a space the space will be lost when concatenation takes place.  This is
because of the treatment that spaces get as a GEDCOM delimiter, many GEDCOM values are trimmed

85

of trailing spaces and some systems look for the first non-space starting after the tag to determine the
beginning of the value.

CONF {CONFIRMATION}:=

The religious event (not LDS) of conferring the gift of the Holy Ghost and, among protestants, full
church membership.

CONL {CONFIRMATION_LDS}:=

The religious event by which a person receives membership in the LDS Church.

CONT {CONTINUED}:=

An indicator that additional data belongs to the superior value. The information from the CONT value is
to be connected to the value of the superior preceding line with a carriage return and/or new line
character. Leading spaces could be important to the formatting of the resultant text. When importing
values from CONT lines the reader should assume only one delimiter character following the CONT
tag. Assume that the rest of the leading spaces are to be a part of the value.

COPR {COPYRIGHT}:=

A statement that accompanies data to protect it from unlawful duplication and distribution.

CORP {CORPORATE}:=

A name of an institution, agency, corporation, or company.

CREM {CREMATION}:=

Disposal of the remains of a person's body by fire.

CTRY {COUNTRY}:=

The name or code of the country.

DATA {DATA}:=

Pertaining to stored automated information.

DATE {DATE}:=

The time of an event in a calendar format.

DEAT {DEATH}:=

The event when mortal life terminates.

DESC {DESCENDANTS}:=

Pertaining to offspring of an individual.

DESI {DESCENDANT_INT}:=

Indicates an interest in research to identify additional descendants of this individual. (See also ANCI,

86

page 84.)

DEST {DESTINATION}:=

A system receiving data.

DIV {DIVORCE}:=

An event of dissolving a marriage through civil action.

DIVF {DIVORCE_FILED}:=

An event of filing for a divorce by a spouse.

DSCR {PHY_DESCRIPTION}:=

The physical characteristics of a person, place, or thing.

EDUC {EDUCATION}:=

Indicator of a level of education attained.

EMAI {EMAIL}:=

An electronic mail address.

EMIG {EMIGRATION}:=

An event of leaving one's homeland with the intent of residing elsewhere.

ENDL {ENDOWMENT}:=

A religious event where an endowment ordinance for an individual was performed by priesthood
authority in an LDS temple.

ENGA {ENGAGEMENT}:=

An event of recording or announcing an agreement between two people to become married.

EVEN {EVENT}:=

Pertaining to a noteworthy happening related to an individual, a group, or an organization. An EVENt
structure is usually qualified or classified by a subordinate use of the TYPE tag.

FACT {FACT}:=

Pertaining to a noteworthy attribute or fact concerning an individual, a group, or an organization. A
FACT structure is usually qualified or classified by a subordinate use of the TYPE tag.

FAM {FAMILY}:=

Identifies a legal, common law, or other customary relationship of man and woman and their children, if
any, or a family created by virtue of the birth of a child to its biological father and mother.

FAMC {FAMILY_CHILD}:=

87

Identifies the family in which an individual appears as a child.

FAMF {FAMILY_FILE}:=

Pertaining to, or the name of, a family file. Names stored in a file that are assigned to a family for doing
temple ordinance work.

FAMS {FAMILY_SPOUSE}:=

Identifies the family in which an individual appears as a spouse.

FAX {FACIMILIE}:=

Electronic facimilie transmission.

FCOM {FIRST_COMMUNION}:=

A religious rite, the first act of sharing in the Lord's supper as part of church worship.

FILE {FILE}:=

An information storage place that is ordered and arranged for preservation and reference.

FORM {FORMAT}:=

An assigned name given to a consistent format in which information can be conveyed.

FONE {PHONETIC}

A phonetic variation of a superior text string

GEDC {GEDCOM}:=

Information about the use of GEDCOM in a transmission.

GIVN {GIVEN_NAME}

A given or earned name used for official identification of a person.

GRAD {GRADUATION}:=

An event of awarding educational diplomas or degrees to individuals.

HEAD {HEADER}:=

Identifies information pertaining to an entire GEDCOM transmission.

HUSB {HUSBAND}:=

An individual in the family role of a married man or father.

IDNO {IDENT_NUMBER}:=

A number assigned to identify a person within some significant external system.

IMMI {IMMIGRATION}:=

88

An event of entering into a new locality with the intent of residing there.

INDI {INDIVIDUAL}:=

A person.

LANG {LANGUAGE}:=

The name of the language used in a communication or transmission of information.

LATI {LATITUDE}:=

A value indicating a coordinate position on a line, plane, or space.

LONG {LONGITUDE}:=

A value indicating a coordinate position on a line, plane, or space.

MAP {MAP}:=

Pertains to a representation of  measurements usually presented in a graphical form.

MARB {MARRIAGE_BANN}:=

An event of an official public notice given that two people intend to marry.

MARC {MARR_CONTRACT}:=

An event of recording a formal agreement of marriage, including the prenuptial agreement in which
marriage partners reach agreement about the property rights of one or both, securing property to their
children.

MARL {MARR_LICENSE}:=

An event of obtaining a legal license to marry.

MARR {MARRIAGE}:=

A legal, common-law, or customary event of creating a family unit of a man and a woman as husband
and wife.

MARS {MARR_SETTLEMENT}:=

An event of creating an agreement between two people contemplating marriage, at which time they
agree to release or modify property rights that would otherwise arise from the marriage.

MEDI {MEDIA}:=

Identifies information about the media or having to do with the medium in which information is stored.

NAME {NAME}:=

A word or combination of words used to help identify an individual, title, or other item. More than one
NAME line should be used for people who were known by multiple names.

89

NATI {NATIONALITY}:=

The national heritage of an individual.

NATU {NATURALIZATION}:=

The event of obtaining citizenship.

NCHI {CHILDREN_COUNT}:=

The number of children that this person is known to be the parent of (all marriages) when subordinate
to an individual, or that belong to this family when subordinate to a FAM_RECORD.

NICK {NICKNAME}:=

A descriptive or familiar that is used instead of, or in addition to, one's proper name.

NMR {MARRIAGE_COUNT}:=

The number of times this person has participated in a family as a spouse or parent.

NOTE {NOTE}:=

Additional information provided by the submitter for understanding the enclosing data.

NPFX {NAME_PREFIX}:=

Text which appears on a name line before the given and surname parts of a name.

i.e. (Lt. Cmndr.) Joseph /Allen/ jr.

In this example Lt. Cmndr. is considered as the name prefix portion.

NSFX {NAME_SUFFIX}:=

Text which appears on a name line after or behind the given and surname parts of a name.

i.e. Lt. Cmndr. Joseph /Allen/ (jr.)

In this example jr. is considered as the name suffix portion.

OBJE {OBJECT}:=

Pertaining to a grouping of attributes used in describing something.  Usually referring to the data
required to represent a multimedia object, such an audio recording, a photograph of a person, or an
image of a document.

OCCU {OCCUPATION}:=

The type of work or profession of an individual.

ORDI {ORDINANCE}:=

Pertaining to a religious ordinance in general.

ORDN {ORDINATION}:=

A religious event of receiving authority to act in religious matters.

90

PAGE {PAGE}:=

A number or description to identify where information can be found in a referenced work.

PEDI {PEDIGREE}:=

Information pertaining to an individual to parent lineage chart.

PHON {PHONE}:=

A unique number assigned to access a specific telephone.

PLAC {PLACE}:=

A jurisdictional name to identify the place or location of an event.

POST {POSTAL_CODE}:=

A code used by a postal service to identify an area to facilitate mail handling.

PROB {PROBATE}:=

An event of judicial determination of the validity of a will. May indicate several related court activities
over several dates.

PROP {PROPERTY}:=

Pertaining to possessions such as real estate or other property of interest.

PUBL {PUBLICATION}:=

Refers to when and/or where a work was published or created.

QUAY {QUALITY_OF_DATA}:=

An assessment of the certainty of the evidence to support the conclusion drawn from evidence.

REFN {REFERENCE}:=

A description or number used to identify an item for filing, storage, or other reference purposes.

RELA {RELATIONSHIP}:=

A relationship value between the indicated contexts.

RELI {RELIGION}:=

A religious denomination to which a person is affiliated or for which a record applies.

REPO {REPOSITORY}:=

An institution or person that has the specified item as part of their collection(s).

RESI {RESIDENCE}:=

An address or place of residence that a family or individual resided.

91

RESN {RESTRICTION}:=

A processing indicator signifying access to information has been denied or otherwise restricted.

RETI {RETIREMENT}:=

An event of exiting an occupational relationship with an employer after a qualifying time period.

RFN {REC_FILE_NUMBER}:=

A permanent number assigned to a record that uniquely identifies it within a known file.

RIN {REC_ID_NUMBER}:=

A number assigned to a record by an originating automated system that can be used by a receiving
system to report results pertaining to that record.

ROLE {ROLE}:=

A name given to a role played by an individual in connection with an event.

ROMN {ROMANIZED}:=

A romanized variation of a superior text string.

SEX {SEX}:=

Indicates the sex of an individual--male or female.

SLGC {SEALING_CHILD}:=

A religious event pertaining to the sealing of a child to his or her parents in an LDS temple ceremony.

SLGS {SEALING_SPOUSE}:=

A religious event pertaining to the sealing of a husband and wife in an LDS temple ceremony.

SOUR {SOURCE}:=

The initial or original material from which information was obtained.

SPFX {SURN_PREFIX}:=

A name piece used as a non-indexing pre-part of a surname.

SSN {SOC_SEC_NUMBER}:=

A number assigned by the United States Social Security Administration. Used for tax identification
purposes.

STAE {STATE}:=

A geographical division of a larger jurisdictional area, such as a State within the United States of
America.

STAT {STATUS}:=

92

An assessment of the state or condition of something.

SUBM {SUBMITTER}:=

An individual or organization who contributes genealogical data to a file or transfers it to someone else.

SUBN {SUBMISSION}:=

Pertains to a collection of data issued for processing.

SURN {SURNAME}:=

A family name passed on or used by members of a family.

TEMP {TEMPLE}:=

The name or code that represents the name of an LDS Church Temple.

TEXT {TEXT}:=

The exact wording found in an original source document.

TIME {TIME}:= 

A time value in a 24-hour clock format, including hours, minutes, and optional seconds, separated by a
colon (:). Fractions of seconds are shown in decimal notation.

TITL {TITLE}:=

A description of a specific writing or other work, such as the title of a book when used in a source
context, or a formal designation used by an individual in connection with positions of royalty or other
social status, such as Grand Duke.

TRLR {TRAILER}:=

At level 0, specifies the end of a GEDCOM transmission.

TYPE {TYPE}:=

A further qualification to the meaning of the associated superior tag. The value does not have any
computer processing reliability. It is more in the form of a short one or two word note that should be
displayed any time the associated data is displayed.

VERS {VERSION}:=

Indicates which version of a product, item, or publication is being used or referenced.

WIFE {WIFE}:=
   An individual in the role as a mother and/or married woman.

WILL {WILL}:=

A legal document treated as an event, by which a person disposes of his or her estate, to take effect
after death. The event date is the date the will was signed while the person was alive. (See also

93

PROBate, page 91.)

WWW {WEB}:=

World Wide Web home page.

94

95

Appendix B
Latter-day Saints 
Temple Codes

(no longer available):

96

Appendix C
ANSEL Character Set

The following tables show the spacing and non-spacing diacritic characters that are contained in the
ANSEL set required by the languages supported by GEDCOM 5. This table was added to give help to
those receiving the GEDCOM standard on disk. The graphic characters shown are not always accurate,
however the name of the diacritic and the decimal equivalent should agree with the ANSEL standard.
ANSEL is implemented by replacing any code page characters that are greater than hex 7E with its
ANSEL equivalent from this table.  Sometimes this requires one character found from the spacing
character table and sometimes this requires two characters.  Most diacritical markings require two
characters.  In this case the non-spacing diacritical mark is found from the non-spacing character table
followed by the base character, for example, an a with an angstrom or little circle above is represented by
two characters, hex EA followed by the normal hex code for the letter a, which is hex 61.

!

!

!

!

!

HEX is the hexidecimal equivalent to the  column and row of the American National Standard
Z39.47-1985 table showing the ANSEL character graphic and its 8 bit binary representation. The
hexadecimal equivalent is obtained from converting the C/R column in to a hexadecimal number,
for example 14/10 converts to EA hex or 234 dec.

wpcode column shows the Wordperfect (code page and character number, for example 1,2)
chosen as the closest representation of the diacritic as shown in Wordperfect 5.1 Appendix P.

Dec column shows to the decimal equivalent for that diacritic as is used in the ANSEL character
set.

Name column gives the english name of the diacritic.

example of use column shows an example of words using this diacritic. For the non-spacing
diacritic, this mark appears before the character in which it should be superimposed.

ANSEL Non-spacing graphic characters

HEX

wpcode Dec

Graphic   Name

example of use

E1

E2

E3

E4

E5

1,0

1,6

1,3

1,2

1,8

225

226

227

228

229

!

´

ˆ

˜

¯

grave accent

acute accent

circumflex accent

tilde

macron

règle

está

même

niño

g~j(cid:145)js

97

C/R

wpcode

Dec

Graphic

Name

example of use

E6

E7

E8

E9

EA

ED

EE

F0

F1

F6

FE

1,22

1,15

1,7

1,19

1,14

1,10

1,16

1,17

1,18

2,7

1,9

230

231

232

233

234

237

238

240

241

246

254

7

0

¨

ˆ

E

+

1

S

3

O

*

breve

dot above

umlaut (diaeresis)

hacek

circle above (angstrom)

alt|

(cid:243)aba

öppna

vædy

hår

high comma, off center

rozdel+ovac

double acute accent

id¯szaki

cedilla

right hook, ogonek

underscore

ça

viet(cid:129)

samar

high comma, centered

g(cid:143)otermika

98

C/R
A1

wpcode Dec
161
1,152

ANSEL Spacing graphic characters
Graphic
”

Name
slash L—uppercase

example of use
” ód(cid:243)

A2

A3

A4

A5

A6

A8

A9

AA

AB

AE

B0

B1

B2

B3

B4

B5

B6

B8

B9

BA

C3

C5

C6

1,80

1,78

1,88

1,36

1,166

1,1

5,28

4,32

6,1

1,11

2,11

1,153

1,81

1,79

1,89

1,37

1,167

1,24

4,11

1,87

4,23

4,8

4,7

162

163

164

165

166

168

169

170

171

174

176

177

178

179

180

181

182

184

185

186

195

197

198

Ø

o

Þ

Æ

Œ

"

=

®

±

,

#

»

ø

p

þ

æ

œ

i

£

ð

©

¿

¡

slash O—uppercase

slash D—uppercase

thorn—uppercase

ligature AE—uppercase

ligature OE—uppercase

middle dot

musical flat

registered trademark

plus or minus

alif

ayn

slash l—lowercase

slash o—lowercase

slash d—lowercase

thorn—lowercase

ligature ae—lowercase

ligature oe—lowercase

dotless i—lowercase

British pound

eth

copyright mark

inverted question mark

inverted exclamation mark

Øst

o uro

Þann

Ægir

Œuvre

novel"la

Un,yusho

fa#il

rozbi»

høj

pavola

þann

skæg

œuvre

masali

£5.00

verður

©1993

¿Que

¡Esta

99

CF

1,23

207

ß

Ess Zed

Preußen

100

101

